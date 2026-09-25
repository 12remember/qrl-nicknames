"""Conformance tests for the Python package.

Standard library only, so they run with either of:
    python -m unittest discover -s tests     (from python/)
    python -m pytest tests                    (if pytest is installed)
"""

import json
import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "src"))

from qrl_nicknames import (  # noqa: E402
    SPEC_VERSION,
    nickname,
    nickname_parts,
    nickname_slug,
)

SPEC_DIR = HERE.parent.parent / "spec" / "v3"


def _load(name):
    return json.loads((SPEC_DIR / name).read_text(encoding="utf-8"))


class ConformanceTest(unittest.TestCase):
    suite = _load("test-vectors.json")

    def test_spec_version(self):
        self.assertEqual(SPEC_VERSION, 3)

    def test_vectors(self):
        for v in self.suite["vectors"]:
            with self.subTest(input=v["input"]):
                p = nickname_parts(v["input"])
                self.assertEqual(p.name, v["name"])
                self.assertEqual(p.slug, v["slug"])
                self.assertEqual(p.adjective, v["adjective"])
                self.assertEqual(p.creature, v["creature"])
                self.assertEqual(p.tag, v["tag"])
                self.assertEqual(p.words, f"{v['adjective']} {v['creature']}")
                self.assertEqual(nickname(v["input"]), v["name"])
                self.assertEqual(nickname_slug(v["input"]), v["slug"])

    def test_invalid_inputs(self):
        for bad in self.suite["invalid"]:
            with self.subTest(reason=bad["reason"]):
                with self.assertRaises(ValueError):
                    nickname(bad["input"])
        for value in (None, 42, b"Qabc"):
            with self.assertRaises(TypeError):
                nickname(value)

    def test_v2_names_are_prefixes(self):
        for c in _load("v2-compat.json")["vectors"]:
            v3 = nickname(c["address"])
            self.assertTrue(v3.startswith(c["v2_name"]), f"{c['v2_name']} -> {v3}")
            self.assertEqual(len(v3), len(c["v2_name"]) + 3)


if __name__ == "__main__":
    unittest.main()
