export type Person = {
  id: number
  firstName: string
  lastName: string
  age: number
  visits: number
  progress: number
  status: 'relationship' | 'complicated' | 'single'
  subRows?: Person[]
}

const firstNames = [
  'Alice',
  'Bob',
  'Charlie',
  'Diana',
  'Eve',
  'Frank',
  'Grace',
  'Henry',
  'Ivy',
  'Jack',
  'Karen',
  'Leo',
  'Mia',
  'Noah',
  'Olivia',
  'Paul',
  'Quinn',
  'Ruby',
  'Sam',
  'Tina',
  'Uma',
  'Victor',
  'Wendy',
  'Xander',
]

const lastNames = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Garcia',
  'Miller',
  'Davis',
  'Rodriguez',
  'Martinez',
  'Hernandez',
  'Lopez',
  'Gonzalez',
  'Wilson',
  'Anderson',
  'Thomas',
]

const statuses: Person['status'][] = ['relationship', 'complicated', 'single']

// Simple seeded pseudo-random number generator (mulberry32)
function createRng(seed: number) {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const newPerson = (num: number, rand: () => number): Person => {
  return {
    id: num,
    firstName: firstNames[Math.floor(rand() * firstNames.length)]!,
    lastName: lastNames[Math.floor(rand() * lastNames.length)]!,
    age: Math.floor(rand() * 40),
    visits: Math.floor(rand() * 1000),
    progress: Math.floor(rand() * 100),
    status: statuses[Math.floor(rand() * statuses.length)]!,
  }
}

export function makeData(...lens: number[]) {
  const rand = createRng(42)

  const makeDataLevel = (depth = 0): Person[] => {
    const len = lens[depth] ?? 0
    return Array.from({ length: len }, (_, index): Person => {
      return {
        ...newPerson(index, rand),
        subRows: lens[depth + 1] ? makeDataLevel(depth + 1) : undefined,
      }
    })
  }

  return makeDataLevel()
}
