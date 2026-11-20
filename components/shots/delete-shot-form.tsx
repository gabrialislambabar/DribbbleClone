"use client";

import { deleteShot } from "@/app/shots/actions";
import { Button } from "@/components/ui/button";

type DeleteShotFormProps = {
  shotId: string;
  variant?: "button" | "link";
};

export function DeleteShotForm({ shotId, variant = "button" }: DeleteShotFormProps) {
  return (
    <form
      action={deleteShot.bind(null, shotId)}
      onSubmit={(event) => {
        if (!window.confirm("Delete this shot? This cannot be undone.")) {
          event.preventDefault();
        }
      }}
    >
      <Button
        type="submit"
        variant={variant === "link" ? "ghost" : "secondary"}
        size="sm"
        className="text-red-600 hover:bg-red-50 hover:text-red-700"
      >
        Delete
      </Button>
    </form>
  );
}
