import sys
from config import settings
from analyzer import explain_clause_with_llm

print(explain_clause_with_llm("test clause", "Confidentiality", "high"))
