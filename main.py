import subprocess
import json
import os
import anthropic
from dotenv import load_dotenv

load_dotenv()

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

client = anthropic.Anthropic(
    api_key=ANTHROPIC_API_KEY 
)


def get_components():
    command = ['node', 'index.js']

    process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, stderr = process.communicate()

    if process.returncode == 0:
        result = json.loads(stdout.decode('utf-8'))
        components = result['components']

        return components
    else:
        print(f"Error: Subprocess exited with code {process.returncode}")
        print(f"Stderr: {stderr.decode('utf-8')}")
    return []


# Just found out they have a typescript sdk so this will all go away https://docs.anthropic.com/claude/reference/client-sdks
def main():
    # get_components()
    message = client.messages.create(
        model="claude-instant-1.2",
        max_tokens=1000,
        temperature=0.0,
        system="You are a code generator. Respond only with requested source code.",
        messages=[{
            "role": "user",
            "content": "Write a python function that adds two numbers together"
        }]
    )

    print(message)
    print(message.content)

if __name__ == '__main__':
    main()
