"use client";

import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as React from "react";

export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
export const AlertDialogPortal = AlertDialogPrimitive.Portal;

export function AlertDialogContent({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPortal>
      <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" />
      <AlertDialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 grid w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border bg-card p-6 shadow-lg",
          className
        )}
        {...props}
      />
    </AlertDialogPortal>
  );
}

export function AlertDialogHeader(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div className="flex flex-col space-y-2 text-start" {...props} />;
}

export const AlertDialogTitle = AlertDialogPrimitive.Title;
export const AlertDialogDescription = AlertDialogPrimitive.Description;

export function AlertDialogFooter(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end" {...props} />;
}

export function AlertDialogCancel({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>) {
  return <AlertDialogPrimitive.Cancel className={cn(buttonVariants({ variant: "outline" }), className)} {...props} />;
}

export function AlertDialogAction({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>) {
  return <AlertDialogPrimitive.Action className={cn(buttonVariants(), className)} {...props} />;
}
