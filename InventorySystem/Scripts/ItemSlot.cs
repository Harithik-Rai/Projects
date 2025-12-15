using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;
using UnityEngine.UI;
using UnityEngine.EventSystems;
using System;

/// <summary>
/// Represents a single inventory slot that holds items, manages UI display,
/// supports dragging, dropping, stacking, swapping, clicking, and item usage.
/// </summary>
public class ItemSlot : MonoBehaviour, IPointerClickHandler, IBeginDragHandler, IEndDragHandler, IDragHandler, IDropHandler
{
    // -------------------------
    // Item Data
    // -------------------------

    /// <summary>
    /// The name of the item currently stored in this slot.
    /// Empty or null indicates that the slot is empty.
    /// </summary>
    public string itemName;

    /// <summary>
    /// Current number of items inside this slot.
    /// </summary>
    public int quantity;

    /// <summary>
    /// The icon image representing the stored item.
    /// </summary>
    public Sprite itemSprite;

    /// <summary>
    /// Indicates whether the slot has reached max stack size.
    /// </summary>
    public bool isFull;

    /// <summary>
    /// The description text for the current item.
    /// </summary>
    public string itemDescription;

    /// <summary>
    /// Fallback sprite used when slot is empty.
    /// </summary>
    public Sprite emptySprite;

    /// <summary>
    /// Reference to the ScriptableObject data for the stored item.
    /// </summary>
    public ItemData itemData;

    [SerializeField]
    private int maxNumberOfItems;

    // -------------------------
    // Slot UI Elements
    // -------------------------

    /// <summary>
    /// Reference to the UI text showing the stack quantity.
    /// </summary>
    [SerializeField]
    private TMP_Text quantityText;

    /// <summary>
    /// UI image component displaying the item icon.
    /// </summary>
    [SerializeField]
    private Image itemImage;

    // -------------------------
    // Item Description UI
    // -------------------------

    /// <summary>
    /// UI image for the selected item's large preview.
    /// </summary>
    public Image itemDescriptionImage;

    /// <summary>
    /// UI text for displaying item name in the description area.
    /// </summary>
    public TMP_Text ItemDescriptionNameText;

    /// <summary>
    /// UI text for displaying item description in the description area.
    /// </summary>
    public TMP_Text ItemDescriptionText;

    /// <summary>
    /// Shader/highlight used to show when this slot is selected.
    /// </summary>
    public GameObject selectedShader;

    /// <summary>
    /// True if this slot is currently selected.
    /// </summary>
    public bool thisItemSelected;

    private InventoryManager inventoryManager;
    Transform parentAfterDrag;
    private GameObject draggedIcon;

    /// <summary>
    /// Initializes the slot, finds the InventoryManager, configures CanvasGroups,
    /// and ensures quantity label renders above other UI.
    /// </summary>
    private void Start()
    {
        inventoryManager = FindObjectOfType<InventoryManager>();

        if (inventoryManager == null)
        {
            Debug.LogError("InventoryManager not found in scene! Make sure there's an InventoryManager component.");
        }

        if (GetComponent<CanvasGroup>() == null)
        {
            gameObject.AddComponent<CanvasGroup>();
        }

        Canvas textCanvas = quantityText.gameObject.GetComponent<Canvas>();
        if (textCanvas == null)
        {
            textCanvas = quantityText.gameObject.AddComponent<Canvas>();
        }
        textCanvas.overrideSorting = true;
        textCanvas.sortingOrder = 100;
    }

    /// <summary>
    /// Attempts to add an item to this slot, stacking when possible.
    /// Returns leftover quantity if slot is full.
    /// </summary>
    /// <param name="data">ItemData of item being added.</param>
    /// <param name="quantity">How many items to add.</param>
    /// <returns>Leftover quantity that could not fit.</returns>
    public int AddItem(ItemData data, int quantity)
    {
        if (isFull)
        {
            return quantity;
        }

        this.itemData = data;
        this.itemName = data.itemName;
        this.itemSprite = data.itemSprite;
        itemImage.sprite = data.itemSprite;
        this.itemDescription = data.itemDescription;

        this.quantity += quantity;

        if (this.quantity >= data.maxStackSize)
        {
            quantityText.text = data.maxStackSize.ToString();
            quantityText.enabled = true;
            isFull = true;

            int extraItems = this.quantity - data.maxStackSize;
            this.quantity = data.maxStackSize;
            return extraItems;
        }

        quantityText.text = this.quantity.ToString();
        quantityText.enabled = true;

        return 0;
    }

    /// <summary>
    /// Handles pointer click events from Unity's EventSystem.
    /// Supports left-click (select/use) and right-click (drop).
    /// </summary>
    /// <param name="eventData">Click event data.</param>
    public void OnPointerClick(PointerEventData eventData)
    {
        if (eventData.button == PointerEventData.InputButton.Left)
        {
            OnLeftClick();
        }
        if (eventData.button == PointerEventData.InputButton.Right)
        {
            OnRightClick();
        }
    }

    /// <summary>
    /// Handles left-click logic for selecting or using an item.
    /// </summary>
    public void OnLeftClick()
    {
        if (thisItemSelected)
        {
            bool usable = inventoryManager.UseItem(itemName);
            if (usable)
            {
                this.quantity -= 1;
                isFull = false;
                quantityText.text = this.quantity.ToString();
                if (this.quantity <= 0)
                {
                    EmptySlot();
                }
            }
        }
        else
        {
            inventoryManager.DeselectAllSlots();
            selectedShader.SetActive(true);
            thisItemSelected = true;

            ItemDescriptionNameText.text = itemName;
            ItemDescriptionText.text = itemDescription;
            itemDescriptionImage.sprite = itemSprite ?? emptySprite;
        }
    }

    /// <summary>
    /// Clears all data from the slot and resets UI.
    /// </summary>
    private void EmptySlot()
    {
        quantityText.enabled = false;
        itemImage.sprite = emptySprite;
        itemData = null;

        ItemDescriptionNameText.text = "";
        ItemDescriptionText.text = "";
        itemDescriptionImage.sprite = emptySprite;
    }

    /// <summary>
    /// Handles right-click behavior for dropping items into the world.
    /// </summary>
    public void OnRightClick()
    {
        if (itemData != null && !itemData.isDroppable) return;

        GameObject player = GameObject.FindGameObjectWithTag("Player");
        if (player == null)
        {
            Debug.LogWarning("Can't drop item: No player found with 'Player' tag!");
            return;
        }

        GameObject itemToDrop = new GameObject(itemName);
        Items newItem = itemToDrop.AddComponent<Items>();
        newItem.quantity = 1;
        newItem.itemData = itemData;

        SpriteRenderer sr = itemToDrop.AddComponent<SpriteRenderer>();
        sr.sprite = itemSprite;
        sr.sortingOrder = 5;
        sr.sortingLayerName = "Ground";

        itemToDrop.AddComponent<BoxCollider2D>();

        itemToDrop.transform.position = player.transform.position + new Vector3(-1, 0, 0);

        this.quantity -= 1;
        isFull = false;
        quantityText.text = this.quantity.ToString();

        if (this.quantity <= 0)
        {
            EmptySlot();
        }
    }

    /// <summary>
    /// Called when the user begins dragging an item slot.
    /// Creates a temporary drag icon and makes the slot semi-transparent.
    /// </summary>
    public void OnBeginDrag(PointerEventData eventData)
    {
        if (string.IsNullOrEmpty(itemName)) return;

        itemDescriptionImage.sprite = emptySprite;
        ItemDescriptionNameText.text = "";
        ItemDescriptionText.text = "";

        selectedShader.SetActive(false);
        thisItemSelected = false;

        draggedIcon = new GameObject("DraggedIcon");
        Canvas canvas = GetComponentInParent<Canvas>();
        draggedIcon.transform.SetParent(canvas.transform, false);
        draggedIcon.transform.SetAsLastSibling();

        Image dragImage = draggedIcon.AddComponent<Image>();
        dragImage.sprite = itemSprite;
        dragImage.raycastTarget = false;
        dragImage.rectTransform.sizeDelta = itemImage.rectTransform.sizeDelta;

        CanvasGroup canvasGroup = GetComponent<CanvasGroup>();
        if (canvasGroup != null)
        {
            canvasGroup.alpha = 0.6f;
            canvasGroup.blocksRaycasts = false;
        }
    }

    /// <summary>
    /// Updates dragged icon position while dragging.
    /// </summary>
    public void OnDrag(PointerEventData eventData)
    {
        if (draggedIcon != null)
        {
            draggedIcon.transform.position = Input.mousePosition;
        }
    }

    /// <summary>
    /// Finalizes dragging, restores slot transparency, removes drag icon.
    /// </summary>
    public void OnEndDrag(PointerEventData eventData)
    {
        if (draggedIcon != null)
        {
            Destroy(draggedIcon);
        }

        CanvasGroup canvasGroup = GetComponent<CanvasGroup>();
        if (canvasGroup != null)
        {
            canvasGroup.alpha = 1f;
            canvasGroup.blocksRaycasts = true;
        }
    }

    /// <summary>
    /// Handles drop behavior, including stacking or swapping items.
    /// </summary>
    /// <param name="eventData">Drop event data.</param>
    public void OnDrop(PointerEventData eventData)
    {
        if (eventData.pointerDrag == null) return;

        ItemSlot draggedSlot = eventData.pointerDrag.GetComponent<ItemSlot>();
        if (draggedSlot == null) return;

        // --- Stacking logic ---
        if (!string.IsNullOrEmpty(itemName) && !string.IsNullOrEmpty(draggedSlot.itemName) &&
            itemName == draggedSlot.itemName)
        {
            int maxStack = itemData != null ? itemData.maxStackSize : maxNumberOfItems;
            int spaceAvailable = maxStack - quantity;

            if (spaceAvailable > 0)
            {
                int amountToTransfer = Mathf.Min(spaceAvailable, draggedSlot.quantity);
                quantity += amountToTransfer;
                quantityText.text = quantity.ToString();

                if (quantity >= maxStack)
                {
                    isFull = true;
                }

                draggedSlot.quantity -= amountToTransfer;

                if (draggedSlot.quantity <= 0)
                {
                    draggedSlot.itemName = "";
                    draggedSlot.itemData = null;
                    draggedSlot.itemSprite = emptySprite;
                    draggedSlot.itemImage.sprite = emptySprite;
                    draggedSlot.itemDescription = "";
                    draggedSlot.isFull = false;
                    draggedSlot.quantityText.enabled = false;
                    draggedSlot.quantityText.text = "";
                }
                else
                {
                    draggedSlot.quantityText.text = draggedSlot.quantity.ToString();
                    draggedSlot.isFull = false;
                }
            }
        }
        else
        {
            // --- Swap logic ---
            string tempName = itemName;
            int tempQuantity = quantity;
            Sprite tempSprite = itemSprite;
            string tempDescription = itemDescription;
            bool tempIsFull = isFull;
            ItemData tempData = itemData;

            itemName = draggedSlot.itemName;
            quantity = draggedSlot.quantity;
            itemSprite = draggedSlot.itemSprite;
            itemDescription = draggedSlot.itemDescription;
            isFull = draggedSlot.isFull;
            itemData = draggedSlot.itemData;

            if (!string.IsNullOrEmpty(itemName))
            {
                itemImage.sprite = itemSprite;
                quantityText.text = quantity.ToString();
                quantityText.enabled = true;
            }
            else
            {
                itemImage.sprite = emptySprite;
                itemSprite = emptySprite;
                quantityText.enabled = false;
                quantityText.text = "";
            }

            draggedSlot.itemName = tempName;
            draggedSlot.quantity = tempQuantity;
            draggedSlot.itemSprite = tempSprite;
            draggedSlot.itemDescription = tempDescription;
            draggedSlot.isFull = tempIsFull;
            draggedSlot.itemData = tempData;

            if (!string.IsNullOrEmpty(tempName))
            {
                draggedSlot.itemImage.sprite = tempSprite;
                draggedSlot.quantityText.text = tempQuantity.ToString();
                draggedSlot.quantityText.enabled = true;
            }
            else
            {
                draggedSlot.itemImage.sprite = emptySprite;
                draggedSlot.itemSprite = emptySprite;
                draggedSlot.quantityText.enabled = false;
                draggedSlot.quantityText.text = "";
            }
        }
    }
}
