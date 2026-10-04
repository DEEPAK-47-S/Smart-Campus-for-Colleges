import os
import sys

# Ensure root folder is in python module search path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app as app

# Standard WSGI entrypoint for Vercel Python runtime
app.debug = False
