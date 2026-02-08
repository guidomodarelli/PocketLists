import type { ItemNode } from "./types";

export const INITIAL_ITEMS: ItemNode[] = [
  {
    id: "ropa",
    title: "Ropa",
    completed: false,
    children: [
      { id: "ropa-interior", title: "Ropa interior", completed: true, children: [] },
      { id: "pantalones", title: "Pantalones", completed: true, children: [] },
      { id: "joggers", title: "Joggers", completed: true, children: [] },
      { id: "remeras", title: "Remeras", completed: true, children: [] },
      { id: "camisas", title: "Camisas", completed: true, children: [] },
      { id: "buzos", title: "Buzos", completed: true, children: [] },
      { id: "camperas", title: "Camperas", completed: true, children: [] },
      { id: "zapatillas", title: "Zapatillas", completed: true, children: [] },
      { id: "cinturones", title: "Cinturones", completed: true, children: [] },
      { id: "gorro", title: "Gorro de invierno", completed: true, children: [] },
      { id: "bufanda", title: "Bufanda", completed: true, children: [] },
    ],
  },
  {
    id: "entretenimiento",
    title: "Entretenimiento",
    completed: false,
    children: [
      { id: "auriculares", title: "Auriculares", completed: false, children: [] },
      { id: "libro", title: "Libro", completed: false, children: [] },
    ],
  },
  {
    id: "viaje",
    title: "Artículos para el día del viaje",
    completed: false,
    children: [
      { id: "cargador-celular", title: "Cargador de celular", completed: false, children: [] },
      {
        id: "adaptador-enchufe",
        title: "Adaptador de enchufe",
        completed: true,
        children: [],
      },
      { id: "mochila", title: "Mochila", completed: true, children: [] },
      { id: "botella-agua", title: "Botella de agua", completed: true, children: [] },
      {
        id: "higiene",
        title: "Neceser / Bolsito de Higiene Personal",
        completed: false,
        children: [
          { id: "cepillo-dientes", title: "Cepillo de dientes", completed: true, children: [] },
          { id: "desodorante", title: "Desodorante", completed: true, children: [] },
          { id: "pasta-dental", title: "Pasta dental", completed: true, children: [] },
          { id: "crema-manos", title: "Crema de manos", completed: true, children: [] },
          { id: "shampoo", title: "Shampoo y acondicionador", completed: true, children: [] },
          { id: "jabon", title: "Jabón", completed: true, children: [] },
        ],
      },
    ],
  },
];
