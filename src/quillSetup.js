import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

hljs.configure({
  languages: [
    'javascript',
    'python',
    'csharp',
    'sql',
    'html',
    'css',
    'bash',
    'json',
    'typescript'
  ]
});

// QUILL NECESITA ESTO GLOBAL ANTES DE CARGAR
window.hljs = hljs;
