import io
import sys
import os
import base64
import traceback
import contextlib
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

# Ensure Matplotlib operates in non-interactive/headless mode for server environments
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np


class ExecutionResult(BaseModel):
    """
    Structured outcome of executing a Python data analysis snippet.
    """
    success: bool = Field(..., description="True if script executed without uncaught exceptions.")
    stdout: str = Field(default="", description="Captured standard output stream during execution.")
    charts: List[str] = Field(default_factory=list, description="Base64 encoded PNG image strings of Matplotlib figures.")
    error: Optional[str] = Field(default=None, description="String representation of the error if failed.")
    traceback: Optional[str] = Field(default=None, description="Full exception traceback string if failed.")


def execute_python_code(
    code: str,
    dataset_path: Optional[str] = None
) -> ExecutionResult:
    """
    Executes a Python code snippet in an isolated local namespace, capturing stdout,
    generated Matplotlib charts as Base64 PNG strings, and handling runtime errors safely.

    Args:
        code (str): The Python code snippet to execute.
        dataset_path (Optional[str]): Optional path to a dataset file (CSV/Excel).
                                      If provided and valid, exposed as `DATASET_PATH` and loaded into `df`.

    Returns:
        ExecutionResult: Structured output containing execution status, stdout, charts, and error details.
    """
    # Close any lingering figures before execution
    plt.close("all")

    # Define a clean local namespace for execution
    local_namespace: Dict[str, Any] = {
        "pd": pd,
        "np": np,
        "plt": plt,
        "DATASET_PATH": dataset_path,
    }

    # Automatically load dataset if path exists and is readable
    if dataset_path and os.path.exists(dataset_path):
        try:
            if dataset_path.endswith(".csv"):
                local_namespace["df"] = pd.read_csv(dataset_path)
            elif dataset_path.endswith((".xls", ".xlsx")):
                local_namespace["df"] = pd.read_excel(dataset_path)
        except Exception:
            # If automatic loading fails, user code can handle file loading manually via DATASET_PATH
            pass

    stdout_buffer = io.StringIO()
    charts: List[str] = []

    try:
        # Redirect stdout and execute snippet in restricted local scope
        with contextlib.redirect_stdout(stdout_buffer):
            exec(code, local_namespace)

        # Extract generated matplotlib figures
        fig_nums = plt.get_fignums()
        for fig_num in fig_nums:
            fig = plt.figure(fig_num)
            buf = io.BytesIO()
            fig.savefig(buf, format="png", bbox_inches="tight")
            buf.seek(0)
            encoded_chart = base64.b64encode(buf.read()).decode("utf-8")
            charts.append(encoded_chart)

        plt.close("all")

        return ExecutionResult(
            success=True,
            stdout=stdout_buffer.getvalue(),
            charts=charts,
            error=None,
            traceback=None,
        )

    except Exception as e:
        plt.close("all")
        err_msg = str(e)
        tb_str = traceback.format_exc()
        return ExecutionResult(
            success=False,
            stdout=stdout_buffer.getvalue(),
            charts=[],
            error=err_msg,
            traceback=tb_str,
        )
