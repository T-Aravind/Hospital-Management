import os
import sys
from pathlib import Path

# Add project root directory to path for serverless imports
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from backend.main import app
