"""Entry point for ``python -m jetson_arena``."""

from __future__ import annotations

import sys

from jetson_arena.cli import main

if __name__ == "__main__":
    sys.exit(main())
