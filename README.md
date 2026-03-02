# ComfyUI-Execute-Python
A single node for executing arbitrary Python code with arbitrary inputs of any types

## Preview
![output_new_min_best](https://github.com/user-attachments/assets/517ad407-8bee-4424-b5ab-ed11f7c34c18)
<img width="1196" height="797" alt="image" src="https://github.com/user-attachments/assets/aa3216de-8a2f-4170-be5c-36b12c2f5620" />

## Installation
Choose one of these options:
1. **Install via ComfyUI-Manager** (search for "Execute Python")
2. Use `Custom Nodes Manager > Install via Git URL` in ComfyUI-Manager
3. Clone the repository into `custom_nodes/` manually (or download .zip from GitHub and unpack it to `custom_nodes/`)

## Usage
Write your Python code in the widget (it may include imports, functions and any other language features) and assign `result` variable somewhere in the code. If you use multiple outputs, use a tuple (for example `result = 1, 2, 3`).

> [!IMPORTANT]
> For safety reasons, this node can't be used from shared workflows, which means that **it would only work if you created it yourself**.

> [!WARNING]
> The code is executed with a simple `exec`, so execute only trusted Python code
