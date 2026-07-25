import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Save, Send, ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BLOG_CATEGORIES,
  createPost,
  updatePost,
  slugify,
  type BlogPost,
} from "@/lib/blog-api";

type Props = {
  post?: BlogPost | null;
};

export function BlogEditor({ post }: Props) {
  const navigate = useNavigate();
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!post);
  const [category, setCategory] = useState<string>(post?.category ?? BLOG_CATEGORIES[0]);
  const [body, setBody] = useState(post?.body ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [tags, setTags] = useState<string[]>(post?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [coverImage, setCoverImage] = useState(post?.cover_image_url ?? "");
  const [saving, setSaving] = useState<null | "draft" | "publish">(null);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  function addTag() {
    const t = tagInput.trim();
    if (!t) return;
    if (!tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  }

  async function save(status: "draft" | "published") {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(status === "published" ? "publish" : "draft");
    try {
      if (post) {
        await updatePost(post.id, {
          existing: post,
          title,
          slug,
          body,
          excerpt: excerpt || undefined,
          category,
          tags,
          cover_image_url: coverImage || null,
          status,
        });
        toast.success(status === "published" ? "Published" : "Saved as draft");
      } else {
        await createPost({
          title,
          slug: slug || undefined,
          body,
          excerpt: excerpt || undefined,
          category,
          tags,
          cover_image_url: coverImage || null,
          status,
        });
        toast.success(status === "published" ? "Published" : "Draft saved");
      }
      navigate({ to: "/portal/blog" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      toast.error(msg);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <button
        onClick={() => navigate({ to: "/portal/blog" })}
        className="mb-6 inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to blog
      </button>

      <div className="label-eyebrow">{post ? "Edit post" : "New post"}</div>
      <h1 className="mt-2 font-display text-4xl tracking-tight">
        {post ? "Edit post" : "Write a post"}
      </h1>

      <div className="mt-8 space-y-6">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="A clear, specific headline"
            className="mt-2 rounded-[3px]"
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <Label htmlFor="slug">URL slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              placeholder="url-friendly-slug"
              className="mt-2 rounded-[3px] font-mono text-sm"
            />
            <p className="mt-1 text-xs text-muted-foreground">/blog/{slug || "…"}</p>
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category" className="mt-2 rounded-[3px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BLOG_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="cover">Cover image URL (optional)</Label>
          <Input
            id="cover"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            placeholder="https://…"
            className="mt-2 rounded-[3px]"
          />
        </div>

        <div>
          <Label htmlFor="excerpt">Excerpt (optional)</Label>
          <Textarea
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="One or two sentences shown on the blog index. Auto-generated if blank."
            rows={2}
            className="mt-2 rounded-[3px]"
          />
        </div>

        <div>
          <Label htmlFor="body">Body</Label>
          <Textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your post. Paragraphs are separated by blank lines. Markdown-style **bold** and *italic* are supported."
            rows={18}
            className="mt-2 rounded-[3px] font-mono text-sm leading-relaxed"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Supports paragraphs and light markdown (**bold**, *italic*, and links).
          </p>
        </div>

        <div>
          <Label htmlFor="tags">Tags</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-[3px] border hairline bg-secondary px-2 py-1 text-xs"
              >
                {t}
                <button
                  onClick={() => setTags(tags.filter((x) => x !== t))}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={`Remove ${t}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <Input
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="Add a tag, then press Enter"
              className="rounded-[3px]"
            />
            <Button type="button" variant="outline" onClick={addTag} className="rounded-[3px]">
              Add
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t hairline pt-6">
          <Button
            variant="outline"
            onClick={() => save("draft")}
            disabled={saving !== null}
            className="rounded-[3px]"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving === "draft" ? "Saving…" : "Save draft"}
          </Button>
          <Button
            onClick={() => save("published")}
            disabled={saving !== null}
            className="rounded-[3px]"
          >
            <Send className="mr-2 h-4 w-4" />
            {saving === "publish"
              ? "Publishing…"
              : post?.status === "published"
                ? "Update"
                : "Publish"}
          </Button>
        </div>
      </div>
    </div>
  );
}
