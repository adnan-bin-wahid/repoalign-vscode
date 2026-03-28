import re
from pathlib import Path
from app.services.file_reader import read_text_file


def extract_imports(content: str) -> list[str]:
    pattern = r'import\s+.*?\s+from\s+[\'"](.*?)[\'"]'
    return re.findall(pattern, content)


def extract_class_names(content: str) -> list[str]:
    pattern = r'export\s+class\s+([A-Za-z0-9_]+)|class\s+([A-Za-z0-9_]+)'
    matches = re.findall(pattern, content)

    class_names = []
    for match in matches:
        for group in match:
            if group:
                class_names.append(group)

    return class_names


def extract_method_names(content: str) -> list[str]:
    pattern = r'^\s*(?:public|private|protected)?\s*(?:async\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*\([^)]*\)\s*(?::\s*[A-Za-z0-9_<>\[\]\|\s,?]+)?\s*\{'
    matches = re.findall(pattern, content, flags=re.MULTILINE)

    ignored = {'if', 'for', 'while', 'switch', 'catch', 'constructor'}
    method_names = []

    for name in matches:
        if name not in ignored and name not in method_names:
            method_names.append(name)

    return method_names


def extract_constructor_injections(content: str) -> list[str]:
    pattern = r'constructor\s*\((.*?)\)'
    match = re.search(pattern, content, flags=re.DOTALL)

    if not match:
        return []

    constructor_body = match.group(1)
    parts = constructor_body.split(',')

    injections = []
    for part in parts:
        cleaned = part.strip()
        if ':' in cleaned:
            type_name = cleaned.split(':')[-1].strip()
            type_name = re.sub(r'[?\s]+', '', type_name)
            if type_name:
                injections.append(type_name)

    return injections


def extract_constructor_injection_variables(content: str) -> list[str]:
    pattern = r'constructor\s*\((.*?)\)'
    match = re.search(pattern, content, flags=re.DOTALL)

    if not match:
        return []

    constructor_body = match.group(1)
    parts = constructor_body.split(',')

    variable_names = []
    for part in parts:
        cleaned = part.strip()

        variable_match = re.search(
            r'(?:public|private|protected)?\s*([A-Za-z_][A-Za-z0-9_]*)\s*:',
            cleaned
        )

        if variable_match:
            variable_name = variable_match.group(1)
            if variable_name not in variable_names:
                variable_names.append(variable_name)

    return variable_names


def extract_service_calls(content: str) -> list[str]:
    pattern = r'this\.([A-Za-z_][A-Za-z0-9_]*)\.([A-Za-z_][A-Za-z0-9_]*)\s*\('
    matches = re.findall(pattern, content)

    calls = []
    for obj_name, method_name in matches:
        call = f"{obj_name}.{method_name}"
        if call not in calls:
            calls.append(call)

    return calls


def infer_file_role(file_path: str) -> str:
    lower = file_path.lower()

    if lower.endswith('.component.ts'):
        return 'component'
    if lower.endswith('.service.ts'):
        return 'service'
    if lower.endswith('.model.ts'):
        return 'model'
    if lower.endswith('.interceptor.ts'):
        return 'interceptor'
    if lower.endswith('.guard.ts'):
        return 'guard'
    if lower.endswith('.module.ts'):
        return 'module'
    if lower.endswith('.routes.ts') or 'routing.module.ts' in lower:
        return 'routing'
    if lower.endswith('.spec.ts') or lower.endswith('.test.ts'):
        return 'test'

    return 'typescript-file'


def extract_keywords_from_path(file_path: str) -> list[str]:
    path_obj = Path(file_path)
    parts = list(path_obj.parts)

    keywords = []
    ignored_tokens = {'e:', 'd:', 'c:', 'src', 'app', 'frontend', 'client'}

    for part in parts:
        cleaned = (
            part.replace('.ts', '')
            .replace('.component', '')
            .replace('.service', '')
            .replace('.model', '')
        )
        tokens = re.split(r'[-_/\\.]', cleaned)

        for token in tokens:
            token = token.strip().lower()
            if token and token not in ignored_tokens and token not in keywords:
                keywords.append(token)

    return keywords


def build_profile_text(profile: dict) -> str:
    lines = [
        f"FILE_PATH: {profile['file_path']}",
        f"ROLE: {profile['role']}",
        f"CLASS_NAMES: {', '.join(profile['class_names']) if profile['class_names'] else 'None'}",
        f"IMPORTS: {', '.join(profile['imports']) if profile['imports'] else 'None'}",
        f"CONSTRUCTOR_INJECTIONS: {', '.join(profile['constructor_injections']) if profile['constructor_injections'] else 'None'}",
        f"INJECTION_VARIABLES: {', '.join(profile['injection_variables']) if profile['injection_variables'] else 'None'}",
        f"METHOD_NAMES: {', '.join(profile['method_names']) if profile['method_names'] else 'None'}",
        f"SERVICE_CALLS: {', '.join(profile['service_calls']) if profile['service_calls'] else 'None'}",
        f"PATH_KEYWORDS: {', '.join(profile['path_keywords']) if profile['path_keywords'] else 'None'}"
    ]

    return "\n".join(lines)


def build_file_profile(file_path: str) -> dict:
    content = read_text_file(file_path)

    profile = {
        "file_path": file_path,
        "role": infer_file_role(file_path),
        "imports": extract_imports(content),
        "class_names": extract_class_names(content),
        "constructor_injections": extract_constructor_injections(content),
        "injection_variables": extract_constructor_injection_variables(content),
        "method_names": extract_method_names(content),
        "service_calls": extract_service_calls(content),
        "path_keywords": extract_keywords_from_path(file_path)
    }

    profile["profile_text"] = build_profile_text(profile)

    return profile