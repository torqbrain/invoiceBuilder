export default function AppFooter({ className = "" }: { className?: string }) {
  return (
    <footer className={`text-center text-sm text-muted-foreground ${className}`.trim()}>
      Developed by{" "}
      <a
        href="https://www.torqbrain.com"
        target="_blank"
        rel="noreferrer"
        className="text-primary hover:underline"
      >
        torqbrain
      </a>
      .
    </footer>
  );
}
