using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Items : MonoBehaviour
{
    [Header("Item Data")]
    /// <summary>
    /// The item data that defines this item's properties, name, icon, and behavior.
    /// </summary>
    [SerializeField]
    public ItemData itemData;

    /// <summary>
    /// How many of this item the world object represents when picked up.
    /// </summary>
    [SerializeField]
    public int quantity = 1;

    [Header("Pickup Settings")]
    /// <summary>
    /// If true, the item is automatically picked up when the player collides with it.
    /// </summary>
    public bool autoPickup = true;

    /// <summary>
    /// Key used to manually pick up the item when within range (only applies if <see cref="autoPickup"/> is false).
    /// </summary>
    public KeyCode pickupKey = KeyCode.E;

    /// <summary>
    /// Distance required for manual pickup. Only applies when auto pickup is disabled.
    /// </summary>
    public float pickupRange = 2f;

    /// <summary>
    /// Reference to the player's InventoryManager, found at runtime.
    /// </summary>
    private InventoryManager inventoryManager;

    /// <summary>
    /// Tracks whether the player is within pickup range when manual pickup is enabled.
    /// </summary>
    private bool playerInRange = false;

    /// <summary>
    /// Attempts to locate the InventoryManager on the "InventoryCanvas" object.
    /// Logs a warning if it is not found.
    /// </summary>
    void Start()
    {
        // Try to find inventory manager (won't error if not found)
        GameObject inventoryCanvas = GameObject.Find("InventoryCanvas");
        if (inventoryCanvas != null)
        {
            inventoryManager = inventoryCanvas.GetComponent<InventoryManager>();
        }

        if (inventoryManager == null)
        {
            Debug.LogWarning("InventoryManager not found! Make sure there's a GameObject named 'InventoryCanvas' with InventoryManager component.");
        }
    }

    /// <summary>
    /// Handles manual item pickup if auto pickup is disabled.
    /// </summary>
    void Update()
    {
        // Manual pickup with key press
        if (!autoPickup && playerInRange && Input.GetKeyDown(pickupKey))
        {
            TryPickup();
        }
    }

    /// <summary>
    /// Handles automatic pickup when using physics-based collisions (2D).
    /// </summary>
    /// <param name="collision">Collision data from Unity.</param>
    private void OnCollisionEnter2D(Collision2D collision)
    {
        if (autoPickup && collision.gameObject.CompareTag("Player"))
        {
            TryPickup();
        }
    }

    /// <summary>
    /// Handles entering trigger zones for both auto and manual pickup systems.
    /// </summary>
    /// <param name="collision">Collider that entered the trigger.</param>
    private void OnTriggerEnter2D(Collider2D collision)
    {
        if (collision.CompareTag("Player"))
        {
            if (autoPickup)
            {
                TryPickup();
            }
            else
            {
                playerInRange = true;
            }
        }
    }

    /// <summary>
    /// Handles leaving pickup range when manual pickup is used.
    /// </summary>
    /// <param name="collision">Collider that exited the trigger.</param>
    private void OnTriggerExit2D(Collider2D collision)
    {
        if (collision.CompareTag("Player"))
        {
            playerInRange = false;
        }
    }

    /// <summary>
    /// Attempts to add this item (and its quantity) to the player's inventory.
    /// If the inventory cannot accept all quantity, the remainder stays in the world.
    /// </summary>
    private void TryPickup()
    {
        if (inventoryManager == null || itemData == null) return;

        int leftOverItems = inventoryManager.AddItem(itemData, quantity);
        if (leftOverItems <= 0)
        {
            Destroy(gameObject);
        }
        else
        {
            quantity = leftOverItems;
        }
    }
}
