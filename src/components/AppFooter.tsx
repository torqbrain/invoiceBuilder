import { Link } from "react-router-dom";

export default function AppFooter({ className = "" }: { className?: string }) {
  return (
    <footer className={`text-center text-sm text-muted-foreground ${className}`.trim()}>
      Developed by{" "}
      <a href="https://www.torqbrain.com" target="_blank" rel="noreferrer" className="text-primary hover:underline">
        torqbrain
      </a>
      .{" "}
      <Link to="/privacypolicy" className="hover:underline">
        Privacy Policy
      </Link>
      {" "}•{" "}
      <Link to="/termsandconditions" className="hover:underline">
        Terms & Conditions
      </Link>
    </footer>
  );
}
