# ComfyUI-Execute-Python
A single node for executing arbitrary Python code with arbitrary inputs of any types

## Preview
![demo](https://github.com/user-attachments/assets/4cba256d-ab0b-409f-852b-5ccde0857ee0)
<img width="1181" height="504" alt="workflow (2)" src="https://github.com/user-attachments/assets/22d1e6d9-6dfa-42ff-b3e7-a875a42fe210" />

## Installation
Choose one of these options:
1. **Install via ComfyUI-Manager** (search for "Execute Python")
2. Use `Custom Nodes Manager > Install via Git URL` in ComfyUI-Manager
3. Clone the repository into `custom_nodes/` manually (or download .zip from GitHub and unpack it to `custom_nodes/`)

## Usage
Write your Python code in the widget (it may include imports, functions and any other language features) and assign `result` variable somewhere in the code.
> [!WARNING]
> The code is executed with a simple `exec`, so execute only trusted Python code
