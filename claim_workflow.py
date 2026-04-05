import argparse
import re

from machineid import hashed_id


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="claim_workflow",
        description="make a workflow that uses ComfyUI-Execute-Python nodes usable on the current machine. "
        "modifies workflow (JSON) in place",
    )

    parser.add_argument("input", type=str, help="path to the workflow (JSON)")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    id_regex = re.compile('"ExecutePython([a-f0-9]{64})?"')
    id_ = f'"ExecutePython{hashed_id("ComfyUI-Execute-Python")}"'
    with open(args.input, "r", encoding="utf-8") as f:
        content = f.read()
    new_content, n_subs = id_regex.subn(id_, content)
    if n_subs == 0:
        raise RuntimeError("no ComfyUI-Execute-Python nodes found in the workflow")
    print(f"found {n_subs} nodes")
    with open(args.input, "w", encoding="utf-8") as f:
        f.write(new_content)


if __name__ == "__main__":
    main()
