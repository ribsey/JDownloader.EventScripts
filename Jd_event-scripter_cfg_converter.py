import json
import argparse
import os
import re
import glob


def parse_args():
    parser = argparse.ArgumentParser(
        description="Extract JavaScript code from a JSON element")
    parser.add_argument("input_file", help="Path to the JSON input file")
    parser.add_argument(
        "output_path", help="Path to the output JavaScript directory")
    return parser.parse_args()


def convert_to_camel_case(name):
    # Convert a string to camel case (e.g., "my_function_name" -> "myFunctionName")
    words = name.split()
    camel_case_name = "".join(word.capitalize() for word in words)
    return camel_case_name


def extract_scripts_from_json(json_data):
    scripts = []

    for element in json_data:
        try:
            name = element.get("name", "")
            script_name = convert_to_camel_case(name)
            function_code = element.get("script", "")
            jd_meta_data = {k: v for k, v in element.items() if k != "script"}
            scripts.append(
                (script_name, jd_meta_data, function_code))
        except:
            pass

    return scripts


def extract_jd_meta_data_and_the_script(js_code):
    # Find the first JSON object within the JavaScript code
    match = re.search(r'({(?:.|\s)*?});', js_code)
    if match:
        json_str = match.group(1)
        script = js_code[match.end(0):].strip()
        try:
            json_str = re.sub(r'(\w+):', r'"\1":', json_str)
            json_str = re.sub(r',(\s*?})', r'\1', json_str)
            jd_meta_data = json.loads(json_str)
            return (jd_meta_data, script)
        except json.JSONDecodeError as e:
            print("Error: Invalid JSON format in the provided code.")
            print(e)
            return None
    else:
        print("Error: No JSON object found in the provided code.")
        return None


def create_js_data(script):
    name = script[0]
    meta = script[1]
    code = script[2]

    content = f'var jd_meta_data = {json.dumps(meta)};\n\n{code}'

    return (name, content)


def dest_file_exists(path):
    dirname = os.path.dirname(path)
    if dirname and not os.path.exists(dirname):
        os.makedirs(dirname, exist_ok=True)

    if os.path.exists(path):
        overwrite = input(
            f"File '{path}' already exists. Overwrite? (y/n): ")
        if overwrite.lower() != "y":
            print("Operation canceled.")
            return True
    return False


def write_output_file(filename, content):
    with open(filename, "w") as js_file:
        js_file.write(content)


def handle_json_file(file, output_path):
    with open(file, "r") as json_file:
        json_data = json.load(json_file)
        scripts = extract_scripts_from_json(json_data)

        for script in scripts:

            name, content = create_js_data(script)

            full_file_path = f'{output_path}/{name}.js'

            if dest_file_exists(full_file_path):
                continue

            write_output_file(full_file_path, content)

            print(f"Script written to {full_file_path}")


def handle_js_files(input_path, output_file):
    scripts = []
    for file in glob.glob(f'{input_path}/*.js'):
        with open(file, "r") as js_file:
            meta, script = extract_jd_meta_data_and_the_script(js_file.read())
            meta['script'] = script
            scripts.append(meta)

    if dest_file_exists(output_file):
        return

    write_output_file(output_file, json.dumps(scripts))

    print(f"Script written to {output_file}")


def main():
    args = parse_args()

    # Read the JSON input file
    try:
        input_file = args.input_file
        output_path = args.output_path

        if os.path.isdir(input_file):
            handle_js_files(input_file, output_path)
        elif os.path.splitext(input_file)[1] == '.json':
            handle_json_file(input_file, output_path)
    except FileNotFoundError:
        print(f"Error: File '{input_file}' not found.")


if __name__ == "__main__":
    main()
