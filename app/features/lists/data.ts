import type { ItemNode, List } from "./types";

export const INITIAL_ITEMS: ItemNode[] = [
  {
    id: "clothing",
    title: "Ropa",
    completed: false,
    children: [
      { id: "underwear", title: "Ropa interior", completed: true, children: [] },
      { id: "pants", title: "Pantalones", completed: true, children: [] },
      { id: "joggers", title: "Joggers", completed: true, children: [] },
      { id: "t-shirts", title: "Remeras", completed: true, children: [] },
      { id: "shirts", title: "Camisas", completed: true, children: [] },
      { id: "sweaters", title: "Buzos", completed: true, children: [] },
      { id: "jackets", title: "Camperas", completed: true, children: [] },
      { id: "sneakers", title: "Zapatillas", completed: true, children: [] },
      { id: "belts", title: "Cinturones", completed: true, children: [] },
      { id: "winter-hat", title: "Gorro de invierno", completed: true, children: [] },
      { id: "scarf", title: "Bufanda", completed: true, children: [] },
    ],
  },
  {
    id: "entertainment",
    title: "Entretenimiento",
    completed: false,
    children: [
      { id: "headphones", title: "Auriculares", completed: false, children: [] },
      { id: "book", title: "Libro", completed: false, children: [] },
    ],
  },
  {
    id: "travel-day",
    title: "Artículos para el día del viaje",
    completed: false,
    children: [
      { id: "phone-charger", title: "Cargador de celular", completed: false, children: [] },
      {
        id: "plug-adapter",
        title: "Adaptador de enchufe",
        completed: true,
        children: [],
      },
      { id: "backpack", title: "Mochila", completed: true, children: [] },
      { id: "water-bottle", title: "Botella de agua", completed: true, children: [] },
      {
        id: "hygiene-kit",
        title: "Neceser / Bolsito de Higiene Personal",
        completed: false,
        children: [
          { id: "toothbrush", title: "Cepillo de dientes", completed: true, children: [] },
          { id: "deodorant", title: "Desodorante", completed: true, children: [] },
          { id: "toothpaste", title: "Pasta dental", completed: true, children: [] },
          { id: "hand-cream", title: "Crema de manos", completed: true, children: [] },
          { id: "shampoo", title: "Shampoo y acondicionador", completed: true, children: [] },
          { id: "soap", title: "Jabón", completed: true, children: [] },
        ],
      },
    ],
  },
];

export const INITIAL_LISTS: List[] = [
  {
    id: "list-travel",
    title: "Lista de viaje",
    items: INITIAL_ITEMS,
  },
];
