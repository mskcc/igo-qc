// "DYNAMIC" loading of css - put all .css into "index.css"
// REF - https://stackoverflow.com/a/41133213/3874247
export function loadFile(filePath) {
    var result = null;
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", filePath, false);
    xmlhttp.send();
    if (xmlhttp.status===200) {
        result = xmlhttp.responseText;
    }
    return result;
}
// REF - https://github.com/Microsoft/monaco-editor/issues/886#issuecomment-392516431
export function loadCss(content) {
    const css = document.createElement("style");
    css.type = "text/css";
    css.innerHTML = content;
    document.head.appendChild(css);
}