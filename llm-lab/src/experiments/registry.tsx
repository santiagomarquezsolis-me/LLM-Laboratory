import type { ComponentType } from "react";
import { Tokenizer } from "./Tokenizer";
import { NextToken } from "./NextToken";
import { Temperature } from "./Temperature";
import { SemanticSpace } from "./SemanticSpace";

export type Experiment = {
  id: string;
  num: string;
  act: string;
  title: string;
  tagline: string;
  color: string;
  Component: ComponentType;
};

export const EXPERIMENTS: Experiment[] = [
  {
    id: "tokenizer",
    num: "01",
    act: "Acto I · Cómo funciona",
    title: "Tokenizador",
    tagline: "El modelo no ve palabras, ve tokens.",
    color: "#54e0d6",
    Component: Tokenizer,
  },
  {
    id: "next-token",
    num: "02",
    act: "Acto I · Cómo funciona",
    title: "Siguiente token",
    tagline: "P(tokenₜ₊₁ | contexto): la máquina, desnuda.",
    color: "#7aa0ff",
    Component: NextToken,
  },
  {
    id: "temperature",
    num: "03",
    act: "Acto I · Cómo funciona",
    title: "Temperatura",
    tagline: "De predecible a delirante con un slider.",
    color: "#ffc24b",
    Component: Temperature,
  },
  {
    id: "semantic",
    num: "04",
    act: "Acto I · Cómo funciona",
    title: "Espacio semántico",
    tagline: "El significado se convierte en geometría.",
    color: "#bb9bff",
    Component: SemanticSpace,
  },
];
