class AnyType(str):
    def __ne__(self, __value: object) -> bool:
        return False


ANY = AnyType("*")


class ByPassTypeTuple(tuple):
    """
    Inspired by rgthree-comfy
    https://github.com/rgthree/rgthree-comfy
    """

    def __len__(self):
        return 10

    def __getitem__(self, index):
        return super().__getitem__(0)


class ExecutePython:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "code": ("STRING", {"multiline": True, "dynamicPrompts": False}),
                "n_outputs": ("INT", {"default": 1, "min": 1, "max": 10, "step": 1}),
            },
            "optional": {
                "arg0": (ANY,),
            },
        }

    RETURN_TYPES = ByPassTypeTuple((ANY,))
    RETURN_NAMES = ByPassTypeTuple(("res0",))
    FUNCTION = "execute_code"
    CATEGORY = "utils"

    def execute_code(self, code, n_outputs, **kwargs):
        context = {}
        context.update(kwargs)
        try:
            exec(code, context)
        except Exception as e:
            raise e
        if "result" in context:
            result = context["result"]

            if not isinstance(result, tuple):
                if n_outputs == 1:
                    result = (result,)
                elif isinstance(result, list):
                    result = tuple(result)
                else:
                    raise ValueError(
                        f"[ExecutePython] expected a tuple, got {type(result)}"
                    )
            if len(result) != n_outputs:
                raise ValueError(
                    f"[ExecutePython] expected tuple of length {n_outputs}, got {len(result)}"
                )

            return result
        else:
            raise RuntimeError(
                "[ExecutePython] `result` variable was not assigned in the Python code"
            )
