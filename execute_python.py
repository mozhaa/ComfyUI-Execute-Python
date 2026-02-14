class AnyType(str):
    def __ne__(self, __value: object) -> bool:
        return False


ANY = AnyType("*")


class ExecutePython:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "code": ("STRING", {"multiline": True, "dynamicPrompts": False}),
            },
            "optional": {
                "arg0": (ANY,),
            },
        }

    RETURN_TYPES = (ANY,)
    RETURN_NAMES = ("result",)
    FUNCTION = "execute_code"
    CATEGORY = "utils"

    def execute_code(self, code, **kwargs):
        context = {}
        context.update(kwargs)
        try:
            exec(code, context)
        except Exception as e:
            raise e
        if "result" in context:
            return (context["result"],)
        else:
            raise RuntimeError(
                "[ExecutePython] `result` variable was not assigned in the Python code"
            )

