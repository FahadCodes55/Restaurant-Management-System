from django.db import models
from django.contrib.auth.models import User
import json

# Create your models here.

# Admin Model
class Admin(models.Model):
    username = models.EmailField()
    password = models.CharField(max_length=100)

    def __str__(self):
        return f"Admin - {self.username}"


# Menu Management Model
class MenuManagement(models.Model):
    dish_name = models.CharField(max_length=100)
    category = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    dish_image = models.ImageField(upload_to='dishes/', null=True, blank=True)
    description = models.TextField()

    tag = models.CharField(max_length=50, blank=True, null=True)
    status = models.CharField(max_length=20, default='Available')

    def __str__(self):
        return f"Menu - {self.dish_name}"


# Employee Hiring Model
class HireEmployee(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True)
    full_name = models.CharField(max_length=100)
    emp_role = models.CharField(max_length=100)
    emp_salary = models.IntegerField()
    emp_email = models.EmailField()
    emp_password = models.CharField(max_length=100)
    emp_duty_status = models.CharField(max_length=20, default='On Duty')

    def __str__(self):
        return f"Hire Employee - {self.full_name}"


# Tables And Sitting Floor Model
class FloorAndTables(models.Model):
    table_name = models.CharField(max_length=100)
    seating_capacity = models.IntegerField()
    zone_area = models.CharField(max_length=200)

    def __str__(self):
        return f"Floor - {self.table_name}"


# Order Checkout Model
class Checkout(models.Model):
    customer_name = models.CharField(max_length=100, blank=True, null=True)
    customer_phone = models.CharField(max_length=20, blank=True, null=True)
    dining_table = models.CharField(max_length=150)
    fulfillment_type = models.CharField(max_length=100, default='Delivery')
    delivery_address = models.TextField(blank=True, null=True)
    payment_type = models.CharField(max_length=100)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    order_items = models.JSONField(blank=True, null=True)

    # For the kitchen Dashboard
    status = models.CharField(max_length=20, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    # For the remember one more thing
    is_supplemental = models.BooleanField(default=False)

    @property
    def short_item_summary(self):
        items = self.order_items
        if not items:
            return "Order Items"

        if isinstance(items, str):
            try:
                items = json.loads(items)
            except:
                items = []

        if not items or not isinstance(items, list):
            return "Order Items"

        first_item = items[0]
        if isinstance(first_item, dict):
            return first_item.get('name') or first_item.get('title') or first_item.get('item_name') or 'Item'
        return str(first_item)

    # Fetch Items and load into checkout
    @property
    def extra_count(self):
        items = self.order_items
        if not items:
            return 0

        if isinstance(items, str):
            try:
                items = json.loads(items)
            except:
                items = []

        if not items or not isinstance(items, list):
            return 0

        return len(items) - 1 if len(items) > 1 else 0

    # Load Items in receipt
    @property
    def item_names_only(self):
        items = self.order_items
        if not items:
            return "Standard Kitchen Order"

        if isinstance(items, str):
            try:
                items = json.loads(items)
            except:
                items = []

        if not items or not isinstance(items, list):
            return "Standard Kitchen Order"

        full_list = []
        for i in items:
            if isinstance(i, dict):
                name = i.get('name') or i.get('title') or i.get('item_name') or 'Item'
                qty = i.get('qty') or i.get('quantity') or 1
                full_list.append(f"{name} (x{qty})")

        return ", ".join(full_list) if full_list else "Standard Kitchen Order"

    def __str__(self):
        return f"Order #{self.id} - {self.customer_name or 'Walk-in'} ({self.dining_table}) [{self.status}]"


# Order Delivery Model
class Delivery(models.Model):
    class DeliveryStatus(models.TextChoices):
        PACKED = 'packed', 'Packed'
        PICKED_UP = 'picked-up', 'Picked Up'
        ON_THE_WAY = 'on-the-way', 'On The Way'
        DELIVERED = 'delivered', 'Delivered'

    order = models.ForeignKey(Checkout, on_delete=models.CASCADE)
    employee = models.ForeignKey(HireEmployee, on_delete=models.CASCADE)

    delivery_status = models.CharField(
        max_length=30,
        choices=DeliveryStatus.choices,
        default=DeliveryStatus.PACKED
    )

    est_time = models.CharField(max_length=20, default='15 mins')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def delivery_address(self):
        return self.order.delivery_address

    def __str__(self):
        return f"Delivery {self.order.id} - {self.delivery_status} ({self.employee.full_name})"