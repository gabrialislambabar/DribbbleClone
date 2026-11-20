"use client";

import { useState, type KeyboardEvent } from "react";

import { MAX_TAGS_PER_SHOT, MAX_TAG_LENGTH } from "@/lib/validation/shot";

type TagInputProps = {
  name: string;
  defaultValue?: string[];
  label?: string;
  hint?: string;
  error?: string;
};

export function TagInput({
  name,
  defaultValue = [],
  label = "Tags",
  hint = `Press Enter or comma to add. Up to ${MAX_TAGS_PER_SHOT} tags, ${MAX_TAG_LENGTH} characters each.`,
  error,
}: TagInputProps) {
  const [tags, setTags] = useState<string[]>(defaultValue);
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function addTag() {
    const next = draft.trim();

    if (!next) {
      return;
    }

    if (next.length > MAX_TAG_LENGTH) {
      setMessage(`Tags must be ${MAX_TAG_LENGTH} characters or fewer.`);
      return;
    }

    if (tags.some((tag) => tag.toLowerCase() === next.toLowerCase())) {
      setDraft("");
      setMessage(null);
      return;
    }

    if (tags.length >= MAX_TAGS_PER_SHOT) {
      setMessage(`Use up to ${MAX_TAGS_PER_SHOT} tags.`);
      return;
    }

    setTags([...tags, next]);
    setDraft("");
    setMessage(null);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag();
      return;
    }

    if (event.key === "Backspace" && draft === "" && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  }

  function removeTag(tagToRemove: string) {
    setTags(tags.filter((tag) => tag !== tagToRemove));
    setMessage(null);
  }

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={`${name}-input`}
        className="block text-sm font-medium text-foreground"
      >
        {label}
      </label>

      <div className="rounded-lg border border-border bg-white p-2 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
        {tags.length > 0 ? (
          <ul className="mb-2 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <li key={tag}>
                <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs text-foreground">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-muted hover:text-foreground"
                    aria-label={`Remove ${tag}`}
                  >
                    ×
                  </button>
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        <input
          id={`${name}-input`}
          type="text"
          value={draft}
          maxLength={MAX_TAG_LENGTH}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={addTag}
          placeholder={tags.length === 0 ? "e.g. mobile, ui, product" : "Add another tag"}
          className="h-8 w-full bg-transparent px-1 text-sm text-foreground outline-none placeholder:text-muted/60"
        />
      </div>

      <input type="hidden" name={name} value={tags.join(",")} />

      {message || error ? (
        <p className="text-xs text-red-600">{message ?? error}</p>
      ) : (
        <p className="text-xs text-muted">{hint}</p>
      )}
    </div>
  );
}
