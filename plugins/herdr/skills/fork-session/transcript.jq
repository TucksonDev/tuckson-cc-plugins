# Renders a Claude Code session transcript (JSONL, slurped) as Markdown.
# Follows the live parent chain from the last message, so rewound branches are dropped.
def text_of: if type == "string" then . else [.[] | select(.type == "text") | .text] | join("\n") end;
def markers: if type == "string" then [] else [.[] | select(.type == "tool_use" and (.name == "Edit" or .name == "Write")) | "[\(.name): \(.input.file_path)]"] end;
def command_line: if test("<command-name>") then capture("<command-name>(?<name>[^<]*)</command-name>").name + (if test("<command-args>") then " " + capture("<command-args>(?<args>[^<]*)</command-args>").args else "" end) else . end;
def body: (.message.content // "") | [(text_of | gsub("^\\s+|\\s+$"; "") | command_line), (markers | join("\n"))] | map(select(length > 0)) | join("\n\n");
def is_message: (.type == "user" or .type == "assistant") and .isSidechain != true;

. as $all
| INDEX($all[] | select(.uuid != null); .uuid) as $byId
| ($all | map(select(is_message)) | last) as $leaf
| [$leaf | while(. != null; $byId[.parentUuid // ""])] | reverse
| map(select(is_message) | {role: .type, body: body} | select(.body | length > 0))
| reduce .[] as $m ([]; if length > 0 and .[-1].role == $m.role then .[:-1] + [{role: $m.role, body: (.[-1].body + "\n\n" + $m.body)}] else . + [$m] end)
| map("## " + (if .role == "user" then "User" else "Assistant" end) + "\n\n" + .body + "\n")
| join("\n")
