# Modular Inventory System for Unity

A modular, drag-and-drop inventory management system for Unity, designed to be easy to integrate, designer-friendly, and highly extensible. Built using ScriptableObjects and Unity UI best practices.

## Features

- **Drag-and-Drop Inventory UI**  
  Smooth mouse-based item movement with automatic slot detection and visual feedback.

- **Intelligent Item Stacking**  
  Automatic stacking and merging of identical items with configurable per-item stack limits.

- **ScriptableObject-Based Items**  
  Create and manage items directly in the Unity Inspector — no code required for basic items.

- **Item Usage System**  
  Left-click to use consumables with built-in support for stat modification (e.g. health).

- **World Item Interaction**  
  Support for automatic pickup on collision or manual pickup via key press, plus item dropping.

- **Item Categories**  
  Consumable, Weapon, Armor, Material, Quest Item, and more.

- **Demo Health System Included**  
  Example health and UI system demonstrating real gameplay integration.

- **Zero External Dependencies**  
  Requires only Unity and TextMeshPro.

## Requirements

- Unity **2020.3 LTS or newer**
- TextMeshPro (automatically included by Unity)
- An **EventSystem** in the scene
- A Player GameObject tagged as `"Player"`

## Installation

1. Clone or download this repository
2. Copy `Assets/InventorySystem` into your project’s `Assets/` folder

## Quick Setup

1. **Add the Inventory UI**
   - Drag `Prefabs/InventoryCanvas.prefab` into your scene
   - Ensure the inventory menu starts disabled (unchecked in Inspector)

2. **Set Up the Player**
   - Tag your player GameObject as `"Player"`
   - (Optional) Add `PlayerHealth` for consumable item support

3. **Verify EventSystem**
   - Ensure an `EventSystem` exists in the scene  
     (`GameObject → UI → Event System`)

Thats it! The system configures itself automatically.

## Usage Overview

- **Open / Close Inventory:** Configurable key (default: `I`)
- **Select Item:** Left-click
- **Use Item:** Left-click selected item
- **Drop Item:** Right-click
- **Move / Stack Items:** Drag between slots

All keybinds and settings are configurable via the Inspector.

## Extending the System

- Create custom item behavior by inheriting from `ItemData`
- Add items programmatically using `InventoryManager.AddItem()`
- Integrate with quests, shops, equipment, or crafting systems

The architecture is designed to be extended without modifying core code.

## License

MIT License, free to use, modify, and distribute.

## Author

**Harithik Rai**  
Version 1.0.0
