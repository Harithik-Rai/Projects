using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class InventoryManager : MonoBehaviour
{
    [Header("UI References")]
    /// <summary>
    /// The root UI object for the inventory menu. Toggled on/off using <see cref="ToggleInventory"/>.
    /// </summary>
    public GameObject InventoryMenu;

    /// <summary>
    /// Array of item slots that make up the inventory system.
    /// </summary>
    public ItemSlot[] itemSlot;

    [Header("Input Settings")]
    /// <summary>
    /// Key used to toggle the inventory menu on and off.
    /// </summary>
    public KeyCode inventoryKey = KeyCode.I; // Customizable key

    /// <summary>
    /// Tracks whether the inventory menu is currently active.
    /// </summary>
    private bool menuActivated;

    /// <summary>
    /// Called every frame. Checks for inventory toggle input.
    /// </summary>
    void Update()
    {
        // Use KeyCode instead of Input Manager string
        if (Input.GetKeyDown(inventoryKey))
        {
            ToggleInventory();
        }
    }

    /// <summary>
    /// Toggles the inventory menu's active state.
    /// </summary>
    public void ToggleInventory()
    {
        menuActivated = !menuActivated;
        InventoryMenu.SetActive(menuActivated);
    }

    /// <summary>
    /// Attempts to use an item with the given name. Searches all item slots for a matching item.
    /// </summary>
    /// <param name="itemName">The name of the item to use.</param>
    /// <returns>
    /// Returns <c>true</c> if the item was used successfully, otherwise <c>false</c>.
    /// </returns>
    public bool UseItem(string itemName)
    {
        for (int i = 0; i < itemSlot.Length; i++)
        {
            if (itemSlot[i].itemData != null && itemSlot[i].itemData.itemName == itemName)
            {
                bool usable = itemSlot[i].itemData.UseItem();
                return usable;
            }
        }
        return false;
    }

    /// <summary>
    /// Adds an item to the inventory by stacking it with existing items or placing it in empty slots.
    /// </summary>
    /// <param name="itemData">The item type to add.</param>
    /// <param name="quantity">The number of items to add.</param>
    /// <returns>
    /// Returns the number of items that could not be added due to lack of space.
    /// </returns>
    public int AddItem(ItemData itemData, int quantity)
    {
        if (itemData == null) return quantity;

        // First, try to stack with existing items of the same type
        for (int i = 0; i < itemSlot.Length; i++)
        {
            if (itemSlot[i].itemData == itemData && !itemSlot[i].isFull)
            {
                int leftOverItems = itemSlot[i].AddItem(itemData, quantity);
                if (leftOverItems > 0)
                {
                    leftOverItems = AddItem(itemData, leftOverItems);
                }
                return leftOverItems;
            }
        }

        // If no existing stack found, find an empty slot
        for (int i = 0; i < itemSlot.Length; i++)
        {
            if (itemSlot[i].quantity == 0)
            {
                int leftOverItems = itemSlot[i].AddItem(itemData, quantity);
                if (leftOverItems > 0)
                {
                    leftOverItems = AddItem(itemData, leftOverItems);
                }
                return leftOverItems;
            }
        }

        return quantity;
    }

    /// <summary>
    /// Deselects all item slots by disabling their visual highlight and clearing selection flags.
    /// </summary>
    public void DeselectAllSlots()
    {
        for (int i = 0; i < itemSlot.Length; i++)
        {
            itemSlot[i].selectedShader.SetActive(false);
            itemSlot[i].thisItemSelected = false;
        }
    }
}
