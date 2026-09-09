"""Exercises trace_kiosk.py: the exporter must actually run the dry-run app
code (not hand-write prose) and its JSON must stay free of secrets."""

import json
import os
import subprocess
import sys

FORBIDDEN_SUBSTRINGS = ("consumer_secret", "passkey")
HEX64_RE = __import__("re").compile(r"\b(0x)?[0-9a-fA-F]{64}\b")


def test_exporter_produces_four_journeys_without_secrets(tmp_path):
    out_path = tmp_path / "kiosk.json"
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    script = os.path.join(repo_root, "trace_kiosk.py")

    result = subprocess.run(
        [sys.executable, script, str(out_path)],
        cwd=repo_root,
        capture_output=True,
        text=True,
        timeout=120,
    )
    assert result.returncode == 0, result.stderr
    assert out_path.exists()

    data = json.loads(out_path.read_text(encoding="utf-8"))
    assert "generated" in data
    assert "mode" in data
    journeys = data["journeys"]
    assert len(journeys) == 4

    expected_ids = {
        "buy_gas_mpesa_daraja",
        "buy_gas_mpesa_jenga",
        "buy_gas_equitel_jenga",
        "fee_payout",
    }
    assert {j["id"] for j in journeys} == expected_ids

    for journey in journeys:
        steps = journey["steps"]
        assert len(steps) >= 5, f"{journey['id']} has fewer than 5 steps"
        for i, step in enumerate(steps, start=1):
            assert step["n"] == i
            assert step["actor"] in {
                "user",
                "kiosk",
                "daraja",
                "jenga",
                "bridge",
                "chain",
                "worker",
            }
            assert step["layer"] in {"fiat", "kiosk", "chain"}
            evidence_text = json.dumps(step["evidence"])
            for forbidden in FORBIDDEN_SUBSTRINGS:
                assert (
                    forbidden not in evidence_text.lower()
                ), f"{journey['id']} step {step['n']} evidence leaked {forbidden!r}"
            for match in HEX64_RE.finditer(evidence_text):
                # A 64-hex-char value is only ever the synthetic public tx
                # hash used by this trace; a private key never appears.
                assert match.group(0) == "0x" + "7a" * 32, (
                    f"{journey['id']} step {step['n']} evidence has an "
                    f"unexpected 64-hex value: {match.group(0)}"
                )
