from .execute_python import ExecutePython

NODE_CLASS_MAPPINGS = {"ExecutePython": ExecutePython}
NODE_DISPLAY_NAME_MAPPINGS = {"ExecutePython": "Execute Python"}
WEB_DIRECTORY = "./js"

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
