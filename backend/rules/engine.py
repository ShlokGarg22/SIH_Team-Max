import os
import re
import json
import uuid
import datetime
import logging
from typing import List, Optional, Dict, Any, Tuple

from backend.schemas.agent import RuleSchema, FeedbackExtractionRequest, FeedbackExtractionResponse
from backend.services.ollama_service import OllamaService

logger = logging.getLogger("RulesEngine")
logger.setLevel(logging.INFO)

RULES_FILE_PATH = os.path.join(os.path.dirname(__file__), "rules.md")


class RulesEngine:
    """
    The Shared Self-Improvement & Governance Rules Engine.
    Manages persistent organizational rules in rules.md, dynamically injects
    active approved rules into agent prompts, and extracts new rules from user feedback.
    """

    def __init__(
        self,
        filepath: str = RULES_FILE_PATH,
        ollama_service: Optional[OllamaService] = None,
    ):
        self.filepath = filepath
        self.ollama_service = ollama_service or OllamaService()

    # -------------------------------------------------------------------------
    # 1. Parsing & Retrieval Methods
    # -------------------------------------------------------------------------

    def get_all_rules(
        self,
        agent: Optional[str] = None,
        status: Optional[str] = None,
        category: Optional[str] = None,
    ) -> List[RuleSchema]:
        """
        Parses rules.md and returns a structured list of RuleSchema objects.
        Supports filtering by agent, status, and category.
        """
        if not os.path.exists(self.filepath):
            return []

        rules: List[RuleSchema] = []
        current_agent = "global"

        with open(self.filepath, "r", encoding="utf-8") as f:
            for line in f:
                stripped = line.strip()
                if not stripped:
                    continue

                if stripped.startswith("## "):
                    header = stripped[3:].strip().lower()
                    agent_clean = header.replace("rules", "").replace("agent", "").strip()
                    current_agent = agent_clean if agent_clean else "global"
                    continue

                if stripped.startswith("- "):
                    parsed_rule = self._parse_rule_line(stripped[2:].strip(), current_agent)
                    if parsed_rule:
                        rules.append(parsed_rule)

        # Apply Filters
        filtered = rules
        if agent:
            clean_filter_agent = agent.lower().replace("agent", "").replace("_", "").strip()
            filtered = [
                r for r in filtered
                if clean_filter_agent in r.agent.lower().replace("agent", "").replace("_", "")
            ]
        if status:
            filtered = [r for r in filtered if r.status.lower() == status.lower()]
        if category:
            filtered = [r for r in filtered if r.category.lower() == category.lower()]

        return filtered

    def get_rule_by_id(self, rule_id: str) -> Optional[RuleSchema]:
        """Fetches a single rule by its unique ID."""
        for rule in self.get_all_rules():
            if rule.id.lower() == rule_id.lower():
                return rule
        return None

    def get_rules_for_agent(self, agent_name: str, include_global: bool = True) -> str:
        """
        Extracts active, approved rules for prompt injection.
        Disregards 'disabled' or 'pending' rules.
        """
        clean_target = agent_name.lower().replace("agent", "").replace("_", "").strip()
        all_rules = self.get_all_rules(status="approved")

        agent_rules: List[str] = []
        global_rules: List[str] = []

        for r in all_rules:
            r_agent = r.agent.lower().replace("agent", "").replace("_", "").strip()
            if r_agent == "global" and include_global:
                global_rules.append(f"- {r.rule}")
            elif r_agent == clean_target:
                agent_rules.append(f"- {r.rule}")

        blocks = []
        if global_rules and include_global:
            blocks.append("### Global Rules:\n" + "\n".join(global_rules))
        if agent_rules:
            clean_title = agent_name.replace("_", " ").strip().title()
            if not clean_title.endswith("Rules"):
                if not clean_title.endswith("Agent"):
                    clean_title += " Agent Rules"
                else:
                    clean_title += " Rules"
            blocks.append(f"### {clean_title}:\n" + "\n".join(agent_rules))

        return "\n\n".join(blocks)

    # -------------------------------------------------------------------------
    # 2. Rule Mutations (Add, Update, Toggle, Delete)
    # -------------------------------------------------------------------------

    def add_rule(
        self,
        agent_name: str,
        rule: str,
        category: str = "operational_guardrail",
        priority: str = "high",
        status: str = "approved",
    ) -> RuleSchema:
        """
        Appends a new rule under the specified agent section in rules.md.
        """
        clean_agent = agent_name.lower().replace("agent", "").replace("_", "").strip() or "global"
        prefix = clean_agent[:3] if len(clean_agent) >= 3 else "rul"
        rule_id = f"rule_{prefix}_{uuid.uuid4().hex[:6]}"
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        new_rule_obj = RuleSchema(
            id=rule_id,
            agent=clean_agent,
            category=category,
            rule=rule.strip(),
            status=status,
            priority=priority,
            created_at=now_str,
        )

        formatted_line = self._format_rule_line(new_rule_obj)
        target_section_header = f"## {clean_agent.capitalize()} Agent Rules" if clean_agent != "global" else "## Global Rules"

        content = ""
        if os.path.exists(self.filepath):
            with open(self.filepath, "r", encoding="utf-8") as f:
                content = f.read()

        # Check if header exists
        header_pattern = re.compile(rf"^##\s+{re.escape(clean_agent)}.*$", re.IGNORECASE | re.MULTILINE)
        if header_pattern.search(content):
            lines = content.splitlines()
            new_lines = []
            inserted = False
            for line in lines:
                new_lines.append(line)
                if not inserted and header_pattern.match(line):
                    new_lines.append(formatted_line)
                    inserted = True
            content = "\n".join(new_lines)
        else:
            section_block = f"\n\n{target_section_header}\n{formatted_line}"
            content = content.rstrip() + section_block + "\n"

        with open(self.filepath, "w", encoding="utf-8") as f:
            f.write(content.strip() + "\n")

        logger.info(f"Added new rule [{rule_id}] under '{clean_agent}'")
        return new_rule_obj

    def append_new_rule(self, agent_name: str, new_rule: str) -> bool:
        """Helper alias for add_rule."""
        try:
            self.add_rule(agent_name=agent_name, rule=new_rule)
            return True
        except Exception:
            return False

    def update_rule(
        self,
        rule_id: str,
        rule: Optional[str] = None,
        category: Optional[str] = None,
        priority: Optional[str] = None,
        status: Optional[str] = None,
        agent: Optional[str] = None,
    ) -> Optional[RuleSchema]:
        """
        Updates an existing rule in rules.md.
        """
        existing = self.get_rule_by_id(rule_id)
        if not existing:
            return None

        updated_obj = RuleSchema(
            id=existing.id,
            agent=agent or existing.agent,
            category=category or existing.category,
            rule=rule if rule is not None else existing.rule,
            status=status or existing.status,
            priority=priority or existing.priority,
            created_at=existing.created_at,
        )

        if not os.path.exists(self.filepath):
            return None

        with open(self.filepath, "r", encoding="utf-8") as f:
            lines = f.readlines()

        new_lines = []
        found = False
        target_id_tag = f"id: {rule_id}"

        for line in lines:
            if target_id_tag in line or (rule_id in line and line.strip().startswith("- ")):
                new_lines.append(self._format_rule_line(updated_obj) + "\n")
                found = True
            else:
                new_lines.append(line)

        if found:
            with open(self.filepath, "w", encoding="utf-8") as f:
                f.writelines(new_lines)
            return updated_obj

        return None

    def toggle_rule(self, rule_id: str, active: bool) -> Optional[RuleSchema]:
        """Toggles a rule status between 'approved' and 'disabled'."""
        new_status = "approved" if active else "disabled"
        return self.update_rule(rule_id=rule_id, status=new_status)

    def delete_rule(self, rule_id: str) -> bool:
        """Removes a rule completely from rules.md."""
        if not os.path.exists(self.filepath):
            return False

        with open(self.filepath, "r", encoding="utf-8") as f:
            lines = f.readlines()

        target_id_tag = f"id: {rule_id}"
        new_lines = [
            line for line in lines
            if not (target_id_tag in line or (rule_id in line and line.strip().startswith("- ")))
        ]

        if len(new_lines) != len(lines):
            with open(self.filepath, "w", encoding="utf-8") as f:
                f.writelines(new_lines)
            logger.info(f"Deleted rule [{rule_id}] from {self.filepath}")
            return True

        return False

    # -------------------------------------------------------------------------
    # 3. AI Feedback-to-Rule Extraction Engine
    # -------------------------------------------------------------------------

    def extract_rule_from_feedback(
        self,
        user_feedback: str,
        agent_name: str = "global",
        context: Optional[str] = None,
        auto_save: bool = False,
        auto_approve: bool = False,
    ) -> FeedbackExtractionResponse:
        """
        Uses local LLM (or heuristic fallback) to synthesize a structured, invariant
        industrial rule from user correction/thumbs-down feedback.
        """
        system_prompt = (
            "You are the Self-Improvement & Governance Architect for an industrial multi-agent AI workbench.\n"
            "An engineer or operator provided corrective feedback on an AI agent's answer.\n"
            "Your task is to convert their specific correction into a concise, actionable, generalized rule.\n\n"
            "GUIDELINES FOR EXTRACTED RULES:\n"
            "- The rule must be an operational invariant (e.g. 'Always prioritize SOP-2024 revisions for steam turbine maintenance').\n"
            "- It must specify what to do or what NOT to do.\n"
            "- Assign an appropriate category: 'safety', 'source_priority', 'procedural_guardrail', 'formatting', 'calculation'.\n"
            "- Assign priority: 'high', 'medium', 'low'.\n"
            "- Target the specific agent (visual, rag, data, report, or global).\n\n"
            "OUTPUT JSON SCHEMA:\n"
            "{\n"
            '  "rule": "<The concise extracted rule>",\n'
            '  "agent": "<visual | rag | data | report | global>",\n'
            '  "category": "<safety | source_priority | procedural_guardrail | formatting | calculation>",\n'
            '  "priority": "<high | medium | low>",\n'
            '  "reasoning": "<Short explanation of why this rule was extracted>"\n'
            "}"
        )

        user_prompt = f"User Feedback / Correction:\n\"{user_feedback}\"\n"
        if agent_name:
            user_prompt += f"\nAssociated Agent: {agent_name}"
        if context:
            user_prompt += f"\nOperational Context:\n{context}"

        llm_result = self.ollama_service.generate_text(
            prompt=user_prompt,
            system_prompt=system_prompt,
            format_json=True,
            temperature=0.1,
        )

        extracted_data = {}
        if llm_result.get("success"):
            extracted_data = self._parse_json(llm_result.get("response", ""))

        if not extracted_data or "rule" not in extracted_data:
            clean_text = user_feedback.strip().rstrip(".")
            if not clean_text.lower().startswith("always") and not clean_text.lower().startswith("never") and not clean_text.lower().startswith("do not"):
                clean_text = f"Ensure: {clean_text}"
            clean_text += "."

            category = "source_priority" if "sop" in user_feedback.lower() else ("safety" if "safety" in user_feedback.lower() or "danger" in user_feedback.lower() else "procedural_guardrail")
            extracted_data = {
                "rule": clean_text,
                "agent": agent_name or "global",
                "category": category,
                "priority": "high",
                "reasoning": "Heuristic synthesis extracted directly from user correction.",
            }

        rule_text = extracted_data.get("rule", user_feedback.strip())
        target_agent = extracted_data.get("agent", agent_name or "global")
        category = extracted_data.get("category", "procedural_guardrail")
        priority = extracted_data.get("priority", "high")
        reasoning = extracted_data.get("reasoning", "Extracted from user feedback.")

        status = "approved" if auto_approve else "pending"
        prefix = target_agent[:3] if len(target_agent) >= 3 else "rul"
        rule_id = f"rule_{prefix}_{uuid.uuid4().hex[:6]}"

        rule_obj = RuleSchema(
            id=rule_id,
            agent=target_agent,
            category=category,
            rule=rule_text,
            status=status,
            priority=priority,
            created_at=datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        )

        saved = False
        if auto_save:
            self.add_rule(
                agent_name=target_agent,
                rule=rule_text,
                category=category,
                priority=priority,
                status=status,
            )
            saved = True

        msg = f"Rule extracted successfully ({status})."
        if saved:
            msg += f" Saved to rules.md with ID: {rule_id}."

        return FeedbackExtractionResponse(
            extracted_rule=rule_obj,
            extraction_reasoning=reasoning,
            auto_saved=saved,
            message=msg,
        )

    # -------------------------------------------------------------------------
    # Internal Helpers
    # -------------------------------------------------------------------------

    def _parse_rule_line(self, line: str, agent_name: str) -> Optional[RuleSchema]:
        """Parses a bullet line in rules.md with or without tags."""
        tag_match = re.match(r"^\[(.*?)\]\s*(.*)$", line)
        if tag_match:
            tags_str, rule_text = tag_match.groups()
            tags = {}
            for item in tags_str.split("|"):
                if ":" in item:
                    k, v = item.split(":", 1)
                    tags[k.strip().lower()] = v.strip()

            rule_id = tags.get("id", f"rule_{uuid.uuid4().hex[:6]}")
            category = tags.get("category", "operational_guardrail")
            priority = tags.get("priority", "high")
            status = tags.get("status", "approved")
            agent = tags.get("agent", agent_name)

            return RuleSchema(
                id=rule_id,
                agent=agent,
                category=category,
                rule=rule_text.strip(),
                status=status,
                priority=priority,
            )
        else:
            return RuleSchema(
                id=f"rule_{uuid.uuid4().hex[:6]}",
                agent=agent_name,
                category="operational_guardrail",
                rule=line.strip(),
                status="approved",
                priority="high",
            )

    def _format_rule_line(self, rule: RuleSchema) -> str:
        """Formats RuleSchema into structured markdown bullet."""
        return (
            f"- [id: {rule.id} | category: {rule.category} | "
            f"priority: {rule.priority} | status: {rule.status}] {rule.rule}"
        )

    def _parse_json(self, text: str) -> Dict[str, Any]:
        """Robust JSON extraction."""
        text = text.strip()
        try:
            return json.loads(text)
        except Exception:
            pass

        json_match = re.search(r"\{.*\}", text, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(0))
            except Exception:
                pass

        return {}


# -----------------------------------------------------------------------------
# Standalone CLI Testing Runner
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    import sys
    import argparse

    if sys.platform == "win32":
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass

    parser = argparse.ArgumentParser(description="Test and manage the Shared Rules Engine.")
    parser.add_argument("--list", "-l", action="store_true", help="List all rules in rules.md")
    parser.add_argument("--agent", "-a", type=str, default=None, help="Filter rules by agent")
    parser.add_argument("--add", type=str, default=None, help="Add a new rule text")
    parser.add_argument("--extract", "-e", type=str, default=None, help="Extract rule from user feedback string")
    args = parser.parse_args()

    engine = RulesEngine()

    print("==================================================")
    print("   Sovereign AI Workbench - Rules Engine CLI      ")
    print("==================================================")

    if args.add:
        target_agent = args.agent or "global"
        added = engine.add_rule(agent_name=target_agent, rule=args.add, category="safety", priority="high")
        print(f"[+] Successfully added rule: [{added.id}] under '{added.agent}'")
        print(f"    Text: {added.rule}")

    elif args.extract:
        print(f"[*] Extracting rule from user feedback:\n    \"{args.extract}\"...")
        res = engine.extract_rule_from_feedback(user_feedback=args.extract, agent_name=args.agent or "global", auto_save=True)
        print(f"[+] Result: {res.message}")
        print(f"[+] Extracted Rule: {res.extracted_rule.rule}")
        print(f"[+] Agent: {res.extracted_rule.agent} | Category: {res.extracted_rule.category} | Priority: {res.extracted_rule.priority}")
        print(f"[+] Reasoning: {res.extraction_reasoning}")

    else:
        rules = engine.get_all_rules(agent=args.agent)
        print(f"[*] Total Rules Loaded: {len(rules)}\n")
        for r in rules:
            status_indicator = "✓" if r.status == "approved" else "✗"
            print(f"[{status_indicator}] [{r.id}] [{r.agent.upper()}] ({r.category} | {r.priority}): {r.rule}")

        print("\n[+] Dynamic Prompt Injection for 'Visual Agent':")
        print(engine.get_rules_for_agent("Visual Agent"))
