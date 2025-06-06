'use client';
import {
  toolbarPlugin,
  KitchenSinkToolbar,
  listsPlugin,
  quotePlugin,
  headingsPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  thematicBreakPlugin,
  frontmatterPlugin,
  codeBlockPlugin,
  sandpackPlugin,
  codeMirrorPlugin,
  directivesPlugin,
  AdmonitionDirectiveDescriptor,
  diffSourcePlugin,
  markdownShortcutPlugin,
  SandpackConfig,
  MDXEditor,
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';

const defaultSnippetContent = `
export default function App() {
  return (
    <div className="App">
      <h1>Hello CodeSandbox</h1>
      <h2>Start editing to see some magic happen!</h2>
    </div>
  );
}
`.trim();

const reactSandpackConfig: SandpackConfig = {
  defaultPreset: 'react',
  presets: [
    {
      label: 'React',
      name: 'react',
      meta: 'live',
      sandpackTemplate: 'react',
      sandpackTheme: 'light',
      snippetFileName: '/App.js',
      snippetLanguage: 'jsx',
      initialSnippetContent: defaultSnippetContent,
    },
  ],
};

interface CustomMDXEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  folder?: string;
  placeholder?: string;
}

const CustomMDXEditor: React.FC<CustomMDXEditorProps> = ({
                                                           value = '',
                                                           onChange,
                                                           folder = 'editor',
                                                           placeholder = 'Start writing...',
                                                         }) => {



  const allPlugins = (diffMarkdown: string) => [
    toolbarPlugin({ toolbarContents: () => <KitchenSinkToolbar /> }),
    listsPlugin(),
    quotePlugin(),
    headingsPlugin(),
    linkPlugin(),
    linkDialogPlugin(),
    //imagePlugin({ imageUploadHandler: handleImageUpload }),
    tablePlugin(),
    thematicBreakPlugin(),
    frontmatterPlugin(),
    codeBlockPlugin({ defaultCodeBlockLanguage: 'js' }),
    sandpackPlugin({ sandpackConfig: reactSandpackConfig }),
    codeMirrorPlugin({
      codeBlockLanguages: {
        js: 'JavaScript',
        jsx: 'JavaScript (JSX)',
        ts: 'TypeScript',
        tsx: 'TypeScript (TSX)',
        css: 'CSS',
        html: 'HTML',
        json: 'JSON',
        md: 'Markdown',
        txt: 'Plain Text',
      },
    }),
    directivesPlugin({ directiveDescriptors: [AdmonitionDirectiveDescriptor] }),
    diffSourcePlugin({ viewMode: 'rich-text', diffMarkdown }),
    markdownShortcutPlugin(),
  ];

  return (
    <div className="relative z-[100]">
      <MDXEditor
        markdown={value}
        onChange={(value) => {
          console.log('value', value);
          onChange?.(value);
        }}
        placeholder={placeholder}
        contentEditableClassName="prose max-w-full font-sans p-4 border border-gray-200 rounded-lg"
        plugins={allPlugins(value)}
      />
    </div>
  );
};

export default CustomMDXEditor;
