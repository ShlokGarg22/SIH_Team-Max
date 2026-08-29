import logging
import sys

# Define color codes for professional terminal output
COLORS = {
    "DEBUG": "\033[94m",     # Blue
    "INFO": "\033[92m",      # Green
    "WARNING": "\033[93m",   # Yellow
    "ERROR": "\033[91m",     # Red
    "CRITICAL": "\033[1;91m",# Bold Red
    "RESET": "\033[0m"       # Reset
}

class ColoredFormatter(logging.Formatter):
    def format(self, record):
        color = COLORS.get(record.levelname, COLORS["RESET"])
        time_str = self.formatTime(record, self.datefmt)
        
        # The record.name is the agent or module name (e.g., 'orchestrator' or 'rag_agent')
        # This creates a beautiful prefix: [TIME] [LEVEL] [AGENT] Message
        prefix = f"{color}[{time_str}] [{record.levelname}] [{record.name.upper()}]{COLORS['RESET']}"
        
        return f"{prefix} {record.getMessage()}"

def setup_logger(name: str) -> logging.Logger:
    """
    Creates and returns a pre-configured logger with colorized terminal output.
    
    Usage:
        from utils.logger import setup_logger
        logger = setup_logger("rag_agent")
        logger.info("Searching ChromaDB for relevant SOPs...")
    """
    logger = logging.getLogger(name)
    
    # Avoid adding duplicate handlers if the logger is requested multiple times
    if not logger.handlers:
        logger.setLevel(logging.INFO) # Default to INFO in production
        
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.DEBUG)
        
        formatter = ColoredFormatter(datefmt="%H:%M:%S")
        console_handler.setFormatter(formatter)
        
        logger.addHandler(console_handler)
        # Prevent log messages from propagating to the root logger to avoid double-printing
        logger.propagate = False
        
    return logger

# A default system logger for general backend events
logger = setup_logger("workbench_api")
