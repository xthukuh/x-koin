# Wokwi harness (phase 1 firmware bring-up)

Open this folder as a project at https://wokwi.com (or VS Code Wokwi extension) once gateway firmware exists. Pinout matches doc 02 exactly; diagram.json is the executable twin of ../xkoin-gateway.svg.

Status: prepared but NOT yet compiled on wokwi.com. This dev sandbox cannot reach wokwi.com (403 host_not_allowed, verified 2026-09-08), so the two custom chip stubs are written against the documented Wokwi custom-chips API and must be verified on first load. Protocol behaviour itself is already proven by protocol/run_sim.py, which does not depend on Wokwi.
