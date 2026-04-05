from .execute_python import ExecutePython

from machineid import hashed_id
id_ = hashed_id("ComfyUI-Execute-Python")

NODE_CLASS_MAPPINGS = {f"ExecutePython{id_}": ExecutePython}
NODE_DISPLAY_NAME_MAPPINGS = {f"ExecutePython{id_}": "Execute Python"}
WEB_DIRECTORY = "./js"

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
