import { useBusiness } from "@/contexts/BusinessContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function BusinessSwitcher() {
  const { businesses, activeBusinessId, setActiveBusinessId } = useBusiness();

  if (businesses.length <= 1 || !activeBusinessId) return null;

  return (
    <Select value={activeBusinessId} onValueChange={setActiveBusinessId}>
      <SelectTrigger className="w-full sm:w-64">
        <SelectValue placeholder="Select business" />
      </SelectTrigger>
      <SelectContent>
        {businesses.map((business) => (
          <SelectItem key={business.id} value={business.id}>
            {business.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
