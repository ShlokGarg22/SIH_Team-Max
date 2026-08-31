import os
import re
import pandas as pd
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

from services.ollama_service import OllamaService
from agents.data_agent.executor import execute_python_code, ExecutionResult
from schemas.agent import AgentRequest, AgentResponse, Evidence


class AgentAnalysisOutput(BaseModel):
    """
    Structured outcome of the Data Analysis Agent process, containing
    the final LLM generated code, attempt count, and execution results.
    """
    query: str
    dataset_path: Optional[str] = None
    generated_code: str
    attempts: int = Field(default=1, description="Number of execution attempts performed (1 to max_attempts).")
    execution_result: ExecutionResult
    llm_error: Optional[str] = None


class DataAnalysisAgent:
    """
    Data Analysis Agent that leverages local Ollama LLMs to generate Python
    data manipulation/visualization code and executes it via the executor,
    with an automatic error-correction retry loop and rigorous prompt guidelines.
    Integrates with standard AgentRequest and AgentResponse schemas.
    """

    def __init__(self, ollama_service: Optional[OllamaService] = None):
        """
        Initialize the Data Analysis Agent.

        Args:
            ollama_service (Optional[OllamaService]): Ollama service client. Uses default if None.
        """
        self.ollama = ollama_service or OllamaService()

    def _extract_dataset_summary(self, dataset_path: str) -> str:
        """
        Extracts metadata summary (shape, columns, data types, sample rows) from dataset.
        Does not load large datasets into prompt context.
        """
        if not os.path.exists(dataset_path):
            return f"Dataset file path '{dataset_path}' does not exist."

        try:
            if dataset_path.endswith(".csv"):
                df_sample = pd.read_csv(dataset_path, nrows=5)
                # Count total rows quickly without loading whole file if large
                with open(dataset_path, "r", encoding="utf-8", errors="ignore") as f:
                    total_rows = max(0, sum(1 for _ in f) - 1)
            elif dataset_path.endswith((".xls", ".xlsx")):
                df_full = pd.read_excel(dataset_path)
                df_sample = df_full.head(5)
                total_rows = len(df_full)
            else:
                return "Unsupported file format."

            summary = [
                f"File: {os.path.basename(dataset_path)}",
                f"Total Rows: {total_rows}",
                f"Columns and Data Types:",
            ]
            for col, dtype in df_sample.dtypes.items():
                summary.append(f"  - {col} ({dtype})")

            summary.append("\nFirst 3 sample rows:")
            summary.append(df_sample.head(3).to_string(index=False))

            return "\n".join(summary)
        except Exception as e:
            return f"Failed to extract dataset summary: {str(e)}"

    def _clean_generated_code(self, raw_text: str) -> str:
        """
        Defensively strips markdown code fences (```python ... ```) or conversational commentary.
        """
        text = raw_text.strip()
        # Pattern matching ```python ... ``` or ``` ... ```
        match = re.search(r"```(?:python)?\s*(.*?)\s*```", text, re.DOTALL | re.IGNORECASE)
        if match:
            return match.group(1).strip()
        
        # If no fences, remove potential leading/trailing quotes or whitespace
        return text

    def run_analysis(
        self,
        query: str,
        dataset_path: Optional[str] = None,
        max_attempts: int = 3
    ) -> AgentAnalysisOutput:
        """
        Performs end-to-end analytical process with automatic error-correction retry loop:
        1. Summarizes dataset schema if path provided.
        2. Prompts Ollama to generate executable Python code using rigorous analytical instructions.
        3. Executes code via executor.py.
        4. If execution fails, captures error & traceback, sends correction prompt back to Ollama,
           and retries up to `max_attempts` total times.
        5. Returns final execution result (success or final failure).

        Args:
            query (str): The natural language data query/instruction.
            dataset_path (Optional[str]): Path to CSV or Excel file.
            max_attempts (int): Maximum total execution attempts (default: 3).

        Returns:
            AgentAnalysisOutput: Structured report containing generated code, attempts, and execution outcome.
        """
        # Step 1: Prepare dataset metadata context
        dataset_info = ""
        if dataset_path:
            dataset_info = self._extract_dataset_summary(dataset_path)

        system_prompt = (
            "You are an expert Data Analyst Python Assistant.\n"
            "Your task is to write ONLY executable Python code to solve the user's analytical query.\n\n"
            "AVAILABLE LIBRARIES IN EXECUTION ENVIRONMENT:\n"
            "- pandas as pd\n"
            "- numpy as np\n"
            "- matplotlib.pyplot as plt\n"
            "Do NOT use Seaborn. Use Matplotlib directly.\n\n"
            "ENVIRONMENT & EXECUTION CONTEXT:\n"
            "- A pandas DataFrame `df` is ALREADY pre-loaded into the scope.\n"
            "- Do NOT attempt to read the dataset from disk again or call pd.read_csv/pd.read_excel if `df` is available.\n"
            "- ALWAYS use `print(...)` to output calculated numbers, statistics, sums, and analytical results so they are captured in stdout.\n\n"
            "ANALYTICAL & MATHEMATICAL RULES:\n"
            "1. Column Verification: Inspect dataset schema and sample rows carefully. Use ONLY column names that exist in `df`. Do NOT invent column names.\n"
            "2. Row-Level Operations First: When a calculation requires multiplying or combining columns per row (e.g. revenue = sales * quantity), perform the row-level calculation FIRST on `df` before grouping or aggregating.\n"
            "   Example: `df['revenue'] = df['sales'] * df['quantity']`, THEN `df.groupby('product')['revenue'].sum()`.\n"
            "   Do NOT multiply aggregated sums (e.g. NEVER do `sum(sales) * sum(quantity)` for product revenue).\n"
            "3. Aggregations & Grouping: Group after row-level metrics are computed. Explicitly specify grouping columns.\n"
            "4. Averages vs Sums: For average/mean queries, use `.mean()`. Do not confuse sum, mean, or median.\n"
            "5. Percentages: Compute numerator and denominator correctly according to user query.\n"
            "6. Correlations: Compute correlations (`.corr()`) only on relevant numerical columns.\n"
            "7. Filtering: Apply subset filter conditions BEFORE performing aggregation or ranking.\n"
            "8. Sorting & Ranking: Calculate the requested target metric first, then sort (`.sort_values(ascending=False)`).\n"
            "9. Matplotlib Charts & Visualizations:\n"
            "   - If the user asks for a chart, graph, plot, or visualization, ALWAYS generate an appropriate Matplotlib chart.\n"
            "   - Plot the exact requested metric.\n"
            "   - Include a meaningful title (`plt.title(...)`), xlabel (`plt.xlabel(...)`), and ylabel (`plt.ylabel(...)`).\n"
            "   - Use `plt.figure()` before plotting. Do NOT call `plt.show()`.\n"
            "10. Missing Values & Security: Handle missing values sensibly without altering calculation intent. Concise, self-contained Python code only. No network, internet, or file writes.\n\n"
            "CRITICAL FORMAT RULES:\n"
            "Return ONLY executable Python code. Do not return Markdown. Do not explain your answer."
        )

        last_code = ""
        last_exec_result: Optional[ExecutionResult] = None

        for attempt in range(1, max_attempts + 1):
            if attempt == 1:
                # Initial Code Generation Prompt
                prompt_content = f"User Request: {query}\n"
                if dataset_info:
                    prompt_content += f"\nDataset Metadata & Sample:\n{dataset_info}\n"
                prompt_content += "\nWrite the Python code to perform this analysis:"
            else:
                # Error Correction Prompt
                prompt_content = (
                    f"User Request: {query}\n"
                    f"{f'Dataset Metadata & Sample:\n{dataset_info}\n' if dataset_info else ''}\n"
                    f"PREVIOUS ATTEMPT FAILED (Attempt {attempt - 1}/{max_attempts}):\n"
                    f"Failed Code:\n{last_code}\n\n"
                    f"Execution Error Message:\n{last_exec_result.error if last_exec_result else 'Unknown error'}\n\n"
                    f"Execution Traceback:\n{last_exec_result.traceback if last_exec_result else ''}\n\n"
                    f"CORRECTION INSTRUCTIONS:\n"
                    f"- Fix the Python code to eliminate the error shown above.\n"
                    f"- Ensure column names match the dataset schema exactly.\n"
                    f"- Continue using the pre-loaded `df` DataFrame.\n"
                    f"- Follow all analytical rules (row-level math first, Matplotlib charts when requested).\n"
                    f"- Return ONLY executable Python code. Do not return Markdown. Do not explain your answer."
                )

            # Call Ollama Service
            llm_res = self.ollama.generate(
                prompt=prompt_content,
                system=system_prompt,
                temperature=0.0
            )

            if not llm_res["success"]:
                return AgentAnalysisOutput(
                    query=query,
                    dataset_path=dataset_path,
                    generated_code=last_code,
                    attempts=attempt,
                    execution_result=last_exec_result or ExecutionResult(
                        success=False,
                        stdout="",
                        charts=[],
                        error=llm_res["error"],
                        traceback=None
                    ),
                    llm_error=llm_res["error"]
                )

            # Clean generated code
            raw_code = llm_res["response"]
            last_code = self._clean_generated_code(raw_code)

            # Execute cleaned code
            last_exec_result = execute_python_code(code=last_code, dataset_path=dataset_path)

            # If execution succeeds, return immediately
            if last_exec_result.success:
                return AgentAnalysisOutput(
                    query=query,
                    dataset_path=dataset_path,
                    generated_code=last_code,
                    attempts=attempt,
                    execution_result=last_exec_result,
                    llm_error=None
                )

        # All attempts exhausted
        return AgentAnalysisOutput(
            query=query,
            dataset_path=dataset_path,
            generated_code=last_code,
            attempts=max_attempts,
            execution_result=last_exec_result,
            llm_error=None
        )

    def process_request(self, request: AgentRequest) -> AgentResponse:
        """
        Processes a standardized AgentRequest object and returns a standardized
        AgentResponse matching backend/schemas/agent.py.

        Args:
            request (AgentRequest): Standardized agent request containing task_id, session_id,
                                    agent_target="data_agent", and payload.

        Returns:
            AgentResponse: Standardized agent response schema.
        """
        payload = request.payload or {}
        query = payload.get("query", "")
        dataset_path = payload.get("file_path") or payload.get("dataset_path")

        # Run core analysis logic with retry loop
        analysis_output = self.run_analysis(query=query, dataset_path=dataset_path)

        exec_res = analysis_output.execution_result
        success = exec_res.success and not analysis_output.llm_error

        # Format findings list
        findings: List[str] = []
        if exec_res.stdout and exec_res.stdout.strip():
            findings.append(exec_res.stdout.strip())
        
        if analysis_output.generated_code:
            findings.append(f"Generated Python Code:\n{analysis_output.generated_code}")
            
        for idx, chart_b64 in enumerate(exec_res.charts, 1):
            findings.append(f"Chart {idx} (Base64 PNG): data:image/png;base64,{chart_b64}")

        # Format evidence list
        evidence_list: List[Evidence] = []
        if dataset_path:
            evidence_list.append(
                Evidence(
                    source=dataset_path,
                    confidence=1.0 if success else 0.5
                )
            )

        # Format errors list
        errors_list: List[str] = []
        if not success:
            if analysis_output.llm_error:
                errors_list.append(f"LLM Error: {analysis_output.llm_error}")
            if exec_res.error:
                errors_list.append(f"Execution Error: {exec_res.error}")

        return AgentResponse(
            task_id=request.task_id,
            agent_name="data_agent",
            status="completed" if success else "failed",
            findings=findings,
            evidence=evidence_list,
            confidence=1.0 if success else 0.0,
            errors=errors_list
        )
