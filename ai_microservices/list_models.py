import sys
from config import settings
import google.generativeai as genai
genai.configure(api_key=settings.gemini_api_key)
for m in genai.list_models():
    print(m.name, m.supported_generation_methods)
