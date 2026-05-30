import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered, Strikethrough, Heading1, Heading2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2],
        },
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose prose-sm md:prose-base focus:outline-none max-w-none min-h-[150px] p-4',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className={cn('border rounded-xl bg-background overflow-hidden', className)}>
      <div className="flex items-center gap-1 p-2 border-b bg-muted/50 flex-wrap">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn('p-1.5 rounded-md hover:bg-muted transition-colors', editor.isActive('bold') && 'bg-muted text-foreground font-bold')}
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn('p-1.5 rounded-md hover:bg-muted transition-colors', editor.isActive('italic') && 'bg-muted text-foreground font-bold')}
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={cn('p-1.5 rounded-md hover:bg-muted transition-colors', editor.isActive('strike') && 'bg-muted text-foreground font-bold')}
        >
          <Strikethrough className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-border mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn('p-1.5 rounded-md hover:bg-muted transition-colors', editor.isActive('heading', { level: 1 }) && 'bg-muted text-foreground font-bold')}
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn('p-1.5 rounded-md hover:bg-muted transition-colors', editor.isActive('heading', { level: 2 }) && 'bg-muted text-foreground font-bold')}
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-border mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn('p-1.5 rounded-md hover:bg-muted transition-colors', editor.isActive('bulletList') && 'bg-muted text-foreground font-bold')}
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn('p-1.5 rounded-md hover:bg-muted transition-colors', editor.isActive('orderedList') && 'bg-muted text-foreground font-bold')}
        >
          <ListOrdered className="w-4 h-4" />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
