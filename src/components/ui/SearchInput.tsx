import { Search } from 'lucide-react'

interface SearchInputProps {
  value: string
  placeholder?: string
  onChange: (value: string) => void
}

export const SearchInput = ({ value, placeholder = 'Search...', onChange }: SearchInputProps) => (
  <label className="search-input">
    <Search size={15} />
    <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
  </label>
)
