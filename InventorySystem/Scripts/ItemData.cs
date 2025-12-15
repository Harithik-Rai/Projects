using UnityEngine;
using UnityEngine.Events;

[CreateAssetMenu(fileName = "New Item", menuName = "Inventory/Item")]
public class ItemData : ScriptableObject
{
    /// <summary>
    /// The name of the item displayed in UI and inventory.
    /// </summary>
    [Header("Basic Info")]
    public string itemName;

    /// <summary>
    /// The icon used to represent this item.
    /// </summary>
    public Sprite itemSprite;

    /// <summary>
    /// A detailed description shown in the item info panel.
    /// </summary>
    [TextArea(3, 5)]
    public string itemDescription;

    /// <summary>
    /// Maximum number of items that can be stacked in one slot.
    /// </summary>
    [Header("Properties")]
    public int maxStackSize = 64;

    /// <summary>
    /// The category of this item (consumable, weapon, etc).
    /// </summary>
    public ItemType itemType;

    /// <summary>
    /// Whether the item can be used (consumed/activated).
    /// </summary>
    [Header("Usage")]
    public bool isUsable = true;

    /// <summary>
    /// Whether the item can be dropped from the inventory.
    /// </summary>
    public bool isDroppable = true;

    /// <summary>
    /// Defines which player stat the item modifies (health, stamina, etc).
    /// </summary>
    [Header("Item Effects")]
    public StatToChange statToChange = StatToChange.none;

    /// <summary>
    /// How much the item affects the chosen stat.
    /// </summary>
    public int amountToChangeStat;

    /// <summary>
    /// Defines which attribute the item modifies (speed, strength, etc).
    /// </summary>
    public AttributeToChange attributeToChange = AttributeToChange.none;

    /// <summary>
    /// How much the item affects the chosen attribute.
    /// </summary>
    public int amountToChangeAttribute;

    /// <summary>
    /// List of item categories available to the item.
    /// </summary>
    public enum ItemType
    {
        Consumable,
        Weapon,
        Armor,
        Material,
        QuestItem,
        Misc
    }

    /// <summary>
    /// Player stats that an item may modify.
    /// </summary>
    public enum StatToChange
    {
        none,
        health,
        stamina
    }

    /// <summary>
    /// Player attributes that an item may modify.
    /// </summary>
    public enum AttributeToChange
    {
        none,
        defense,
        speed,
        strength
    }

    /// <summary>
    /// Uses the item on the player if applicable.
    /// Automatically searches for a player with the "Player" tag.
    /// </summary>
    /// <returns>
    /// True if the item was successfully used.
    /// False if usage was not possible.
    /// </returns>
    public bool UseItem()
    {
        GameObject player = GameObject.FindGameObjectWithTag("Player");
        if (player == null)
        {
            Debug.LogWarning("No player found with 'Player' tag!");
            return false;
        }

        if (statToChange == StatToChange.health)
        {
            // Try to find any health component (works with different naming conventions)
            var playerHealth = player.GetComponent<PlayerHealth>();
            if (playerHealth != null)
            {
                if (playerHealth.health >= playerHealth.maxHealth)
                {
                    return false; // health is already full
                }
                playerHealth.ChangeHealth(amountToChangeStat);
                return true;
            }
            else
            {
                Debug.LogWarning("Player doesn't have PlayerHealth component!");
                return false;
            }
        }

        if (statToChange == StatToChange.stamina)
        {
            // Add stamina logic here if needed
            return true;
        }

        return false;
    }
}
