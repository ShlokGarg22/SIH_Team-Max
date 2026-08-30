import os

RULES_FILE_PATH = os.path.join(os.path.dirname(__file__), "rules.md")

class RulesEngine:
    """
    A simple parser to extract specific agent rules from the rules.md file.
    It injects these rules into the LLM system prompts.
    """
    def __init__(self, filepath: str = RULES_FILE_PATH):
        self.filepath = filepath

    def get_rules_for_agent(self, agent_name: str) -> str:
        """
        Parses rules.md and returns the rules block for the specified agent.
        Expects rules.md to have sections like: ## RAG Agent Rules
        """
        if not os.path.exists(self.filepath):
            return ""

        extracted_rules = []
        is_in_section = False
        target_header = f"## {agent_name} Rules".lower()

        with open(self.filepath, "r", encoding="utf-8") as f:
            for line in f:
                normalized_line = line.strip().lower()
                
                # Check if we hit a new header (e.g. ## RAG Agent Rules)
                if normalized_line.startswith("## "):
                    if normalized_line == target_header:
                        is_in_section = True
                        continue
                    else:
                        is_in_section = False # Exited the target section
                
                # If we are in the target section, collect the rule
                if is_in_section and line.strip():
                    extracted_rules.append(line.strip())

        return "\n".join(extracted_rules)

    def append_new_rule(self, agent_name: str, new_rule: str) -> bool:
        """
        Appends a new rule to the rules.md file under the correct agent section.
        This will be used when the user gives 'Thumbs Down' feedback.
        """
        # TODO: Implement file modification logic to insert the rule
        # under the correct heading based on Admin Dashboard approval.
        pass

# --- Example Usage ---
if __name__ == "__main__":
    engine = RulesEngine()
    
    # If the LLM is acting as the RAG agent, inject this into its prompt:
    rag_rules = engine.get_rules_for_agent("RAG Agent")
    print(f"Injected RAG Rules:\n{rag_rules}")
