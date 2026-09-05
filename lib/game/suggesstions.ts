import React from "react"
import {
  Car,
  Crosshair,
  Gamepad2,
  Pickaxe,
  Plane,
  Swords,
  Zap,
} from "lucide-react"

export const suggesstions = [
  {
    label: "Voxel survival",
    icon: React.createElement(Pickaxe),
  },
  {
    label: "Ink samurai duel",
    icon: React.createElement(Swords),
  },
  {
    label: "Comic-book firefight",
    icon: React.createElement(Zap),
  },
  {
    label: "Realistic battlefield",
    icon: React.createElement(Plane),
  },
  {
    label: "Fight-first shooter",
    icon: React.createElement(Crosshair),
  },
  {
    label: "Jungle expedition drive",
    icon: React.createElement(Car),
  },
  {
    label: "Sunny kingdom platformer",
    icon: React.createElement(Gamepad2),
  },
]

export const suggestions = suggesstions
