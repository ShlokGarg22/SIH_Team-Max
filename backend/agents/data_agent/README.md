# Data Analysis Agent

## Role
The "Math Wiz" responsible for processing numerical data, generating charts, and executing raw analytical logic.

## Responsibilities
- Interacts with uploaded CSV or Excel files securely stored in `backend/data/uploads/`.
- Writes native Python scripts (using Pandas/Matplotlib) to parse and analyze the data.
- Safely executes the script using Python `exec()` with a try-catch auto-correction loop for errors.
- Generates statistical findings, predictive trends, or creates visualizations to send to the frontend.

## Inputs / Outputs
- **Input:** User queries asking for statistical analysis or correlations, paired with a dataset file path.
- **Output:** JSON containing the calculated answer or a base64 encoded image (chart) for the UI.
