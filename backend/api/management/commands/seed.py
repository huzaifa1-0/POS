import os
import random
from datetime import date, timedelta, datetime, time
from decimal import Decimal

from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.utils.text import slugify

from api.models import (  # ← change 'your_app' to your actual app name
    Branch,
    Category,
    Expense,
    InventoryLog,
    Item,
    MenuItem,
    Order,
    OrderItem,
    Permission,
    Recipe,
    Resource,
    Role,
    StockEntry,
    UserProfile,
    Vendor,
)

# ─────────────────────────────────────────────
# Constants  —  tweak freely
# ─────────────────────────────────────────────
PASSWORD         = "Test@1234"
MONTHS_OF_DATA   = 3       # how many months of orders / expenses to generate
NUM_ORDERS       = 40      # orders per day (realistic busy restaurant)
NUM_CASHIERS     = 3       # cashier accounts per branch

# ─────────────────────────────────────────────
# Static fixture data
# ─────────────────────────────────────────────
BRANCHES = [
    {"name": "Main Branch",    "address": "12 Mall Road, Lahore",        "phone": "042-35761234"},
    {"name": "Gulberg Outlet", "address": "74 MM Alam Road, Gulberg III","phone": "042-35871122"},
    {"name": "DHA Branch",     "address": "8 Khayaban-e-Iqbal, DHA",     "phone": "042-35691010"},
]

CATEGORIES = ["Beverages", "Fast Food", "Desi Food", "Desserts", "Snacks"]

MENU_ITEMS = [
    # (name, price, cost, category)
    ("Zinger Burger",      Decimal("450"),  Decimal("200"), "Fast Food"),
    ("Chicken Shawarma",   Decimal("350"),  Decimal("140"), "Fast Food"),
    ("Beef Burger",        Decimal("500"),  Decimal("220"), "Fast Food"),
    ("Club Sandwich",      Decimal("380"),  Decimal("160"), "Fast Food"),
    ("Chicken Karahi",     Decimal("1200"), Decimal("600"), "Desi Food"),
    ("Mutton Karahi",      Decimal("1800"), Decimal("900"), "Desi Food"),
    ("Daal Makhni",        Decimal("400"),  Decimal("160"), "Desi Food"),
    ("Biryani (Full)",     Decimal("950"),  Decimal("400"), "Desi Food"),
    ("Biryani (Half)",     Decimal("500"),  Decimal("210"), "Desi Food"),
    ("Naan",               Decimal("30"),   Decimal("10"),  "Desi Food"),
    ("Coca Cola (330ml)",  Decimal("100"),  Decimal("55"),  "Beverages"),
    ("Fanta (330ml)",      Decimal("100"),  Decimal("55"),  "Beverages"),
    ("Lassi",              Decimal("150"),  Decimal("50"),  "Beverages"),
    ("Green Tea",          Decimal("120"),  Decimal("30"),  "Beverages"),
    ("Doodh Patti",        Decimal("80"),   Decimal("25"),  "Beverages"),
    ("Gulab Jamun",        Decimal("200"),  Decimal("70"),  "Desserts"),
    ("Kheer",              Decimal("180"),  Decimal("60"),  "Desserts"),
    ("Brownie",            Decimal("250"),  Decimal("100"), "Desserts"),
    ("French Fries",       Decimal("220"),  Decimal("80"),  "Snacks"),
    ("Onion Rings",        Decimal("200"),  Decimal("75"),  "Snacks"),
    ("Spring Rolls (6pc)", Decimal("300"),  Decimal("110"), "Snacks"),
    ("Samosa (4pc)",       Decimal("160"),  Decimal("55"),  "Snacks"),
]

INGREDIENTS = [
    # (name, unit, cost_per_unit, low_stock_threshold)
    ("Chicken Breast",   "kg",    Decimal("650"),  Decimal("5")),
    ("Mutton",           "kg",    Decimal("1400"), Decimal("3")),
    ("All-Purpose Flour","kg",    Decimal("90"),   Decimal("10")),
    ("Cooking Oil",      "litre", Decimal("320"),  Decimal("5")),
    ("Tomatoes",         "kg",    Decimal("80"),   Decimal("5")),
    ("Onions",           "kg",    Decimal("60"),   Decimal("8")),
    ("Garlic",           "kg",    Decimal("300"),  Decimal("2")),
    ("Ginger",           "kg",    Decimal("280"),  Decimal("2")),
    ("Basmati Rice",     "kg",    Decimal("180"),  Decimal("10")),
    ("Milk",             "litre", Decimal("150"),  Decimal("10")),
    ("Sugar",            "kg",    Decimal("120"),  Decimal("5")),
    ("Salt",             "kg",    Decimal("40"),   Decimal("3")),
    ("Cumin Seeds",      "kg",    Decimal("600"),  Decimal("1")),
    ("Coriander Powder", "kg",    Decimal("400"),  Decimal("1")),
    ("Chili Powder",     "kg",    Decimal("500"),  Decimal("1")),
    ("Potatoes",         "kg",    Decimal("70"),   Decimal("8")),
    ("Eggs",             "dozen", Decimal("180"),  Decimal("3")),
    ("Bread Loaf",       "piece", Decimal("120"),  Decimal("5")),
    ("Coca Cola Cans",   "piece", Decimal("55"),   Decimal("24")),
    ("Fanta Cans",       "piece", Decimal("55"),   Decimal("24")),
]

VENDORS = [
    {"name": "Al-Fatah Traders",    "payment_method": "Bank Account", "payment_account": "HBL-00112233"},
    {"name": "Metro Cash & Carry",  "payment_method": "Cash",         "payment_account": None},
    {"name": "Punjab Poultry Farm", "payment_method": "JazzCash",     "payment_account": "03001234567"},
    {"name": "City Bakery Supply",  "payment_method": "EasyPaisa",    "payment_account": "03111234567"},
    {"name": "Pak Agro Farms",      "payment_method": "Cash",         "payment_account": None},
]

RESOURCES_AND_PERMISSIONS = {
    "orders":    ["view", "create", "update", "delete"],
    "menu":      ["view", "create", "update", "delete"],
    "inventory": ["view", "create", "update"],
    "reports":   ["view"],
    "users":     ["view", "create", "update", "delete"],
    "expenses":  ["view", "create"],
}

ORDER_STATUSES  = ["Pending", "Preparing", "Ready", "Completed", "Cancelled"]
PAYMENT_METHODS = ["Cash", "JazzCash", "EasyPaisa", "Card"]
ORDER_TYPES     = ["Dine-In", "Takeaway", "Delivery"]


class Command(BaseCommand):
    help = "Seed the POS database with realistic fake data for testing."

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.MIGRATE_HEADING("\n🌱  Starting POS seed...\n"))

        self._seed_branches()
        self._seed_categories()
        self._seed_menu_items()
        self._seed_ingredients()
        self._seed_vendors()
        self._seed_recipes()
        self._seed_resources_and_permissions()
        self._seed_roles()
        self._seed_users()
        self._seed_stock_entries()
        self._seed_orders()
        self._seed_expenses()

        self.stdout.write(self.style.SUCCESS("\n✅  Seeding complete!\n"))
        self.stdout.write(self.style.SUCCESS(
            f"   Admin  → username: admin        password: {PASSWORD}\n"
            f"   Cashiers → cashier1 / cashier2 / cashier3   password: {PASSWORD}\n"
        ))

    # ── branches ──────────────────────────────────────────────────────────────
    def _seed_branches(self):
        self.stdout.write("  🏢 Seeding branches...")
        self.branches = []
        for b in BRANCHES:
            obj, _ = Branch.objects.update_or_create(
                name=b["name"],
                defaults={"address": b["address"], "phone": b["phone"], "is_active": True}
            )
            self.branches.append(obj)

    # ── categories ────────────────────────────────────────────────────────────
    def _seed_categories(self):
        self.stdout.write("  📂 Seeding categories...")
        self.categories = {}
        for name in CATEGORIES:
            obj, _ = Category.objects.get_or_create(name=name)
            self.categories[name] = obj

    # ── menu items ────────────────────────────────────────────────────────────
    def _seed_menu_items(self):
        self.stdout.write("  🍽️  Seeding menu items...")
        self.menu_items = []
        for name, price, cost, cat_name in MENU_ITEMS:
            obj, _ = MenuItem.objects.update_or_create(
                name=name,
                defaults={
                    "price":           price,
                    "category":        self.categories[cat_name],
                    "stock_available": random.randint(50, 200),
                }
            )
            obj._cost = cost  # store cost for recipe generation
            self.menu_items.append(obj)

    # ── inventory items (ingredients) ─────────────────────────────────────────
    def _seed_ingredients(self):
        self.stdout.write("  📦 Seeding inventory items...")
        self.ingredients = []
        for name, unit, cpu, lst in INGREDIENTS:
            obj, _ = Item.objects.update_or_create(
                name=name,
                defaults={
                    "unit":                unit,
                    "cost_per_unit":       cpu,
                    "quantity_on_hand":    Decimal(str(random.randint(15, 80))),
                    "low_stock_threshold": lst,
                }
            )
            self.ingredients.append(obj)

    # ── vendors ───────────────────────────────────────────────────────────────
    def _seed_vendors(self):
        self.stdout.write("  🏪 Seeding vendors...")
        self.vendors = []
        for v in VENDORS:
            obj, _ = Vendor.objects.update_or_create(
                name=v["name"],
                defaults={
                    "address":         f"Lahore, Pakistan",
                    "payment_method":  v["payment_method"],
                    "payment_account": v["payment_account"],
                }
            )
            self.vendors.append(obj)

    # ── recipes (link menu items → ingredients) ───────────────────────────────
    def _seed_recipes(self):
        self.stdout.write("  📋 Seeding recipes...")
        # Map specific items to their primary ingredients
        recipe_map = {
            "Zinger Burger":      [("Chicken Breast", "0.2500"), ("All-Purpose Flour", "0.0500"), ("Cooking Oil", "0.0500"), ("Bread Loaf", "1")],
            "Chicken Shawarma":   [("Chicken Breast", "0.2000"), ("All-Purpose Flour", "0.1000"), ("Onions", "0.0500")],
            "Beef Burger":        [("All-Purpose Flour", "0.0500"), ("Cooking Oil", "0.0500"), ("Eggs", "0.0833")],
            "Club Sandwich":      [("Bread Loaf", "2"), ("Eggs", "0.1667"), ("Chicken Breast", "0.1500")],
            "Chicken Karahi":     [("Chicken Breast", "0.5000"), ("Tomatoes", "0.2000"), ("Cooking Oil", "0.1000"), ("Garlic", "0.0200"), ("Ginger", "0.0200")],
            "Mutton Karahi":      [("Mutton", "0.5000"), ("Tomatoes", "0.2000"), ("Cooking Oil", "0.1000"), ("Garlic", "0.0200"), ("Ginger", "0.0200")],
            "Daal Makhni":        [("Cooking Oil", "0.0500"), ("Tomatoes", "0.1000"), ("Onions", "0.0500")],
            "Biryani (Full)":     [("Basmati Rice", "0.7500"), ("Chicken Breast", "0.5000"), ("Onions", "0.1000"), ("Cooking Oil", "0.1000")],
            "Biryani (Half)":     [("Basmati Rice", "0.3750"), ("Chicken Breast", "0.2500"), ("Onions", "0.0500"), ("Cooking Oil", "0.0500")],
            "Naan":               [("All-Purpose Flour", "0.1500"), ("Cooking Oil", "0.0100")],
            "Lassi":              [("Milk", "0.3000"), ("Sugar", "0.0300")],
            "Green Tea":          [("Sugar", "0.0200"), ("Milk", "0.0500")],
            "Doodh Patti":        [("Milk", "0.2500"), ("Sugar", "0.0300")],
            "Gulab Jamun":        [("Milk", "0.1000"), ("Sugar", "0.0500"), ("All-Purpose Flour", "0.0500")],
            "Kheer":              [("Milk", "0.3000"), ("Basmati Rice", "0.0500"), ("Sugar", "0.0500")],
            "French Fries":       [("Potatoes", "0.2500"), ("Cooking Oil", "0.0500"), ("Salt", "0.0050")],
            "Onion Rings":        [("Onions", "0.2000"), ("All-Purpose Flour", "0.0500"), ("Cooking Oil", "0.0500")],
            "Spring Rolls (6pc)": [("All-Purpose Flour", "0.1000"), ("Chicken Breast", "0.1500"), ("Cooking Oil", "0.0500")],
            "Samosa (4pc)":       [("All-Purpose Flour", "0.1000"), ("Potatoes", "0.1500"), ("Cooking Oil", "0.0500")],
        }

        ingredient_lookup = {i.name: i for i in self.ingredients}

        for menu_item in self.menu_items:
            if menu_item.name not in recipe_map:
                continue
            for ing_name, qty_str in recipe_map[menu_item.name]:
                ing = ingredient_lookup.get(ing_name)
                if not ing:
                    continue
                Recipe.objects.update_or_create(
                    menu_item=menu_item,
                    ingredient=ing,
                    defaults={"quantity_required": Decimal(qty_str)}
                )

        # Canned drinks: simple direct ingredient linkage
        for item_name, ing_name in [("Coca Cola (330ml)", "Coca Cola Cans"), ("Fanta (330ml)", "Fanta Cans")]:
            menu_item = next((m for m in self.menu_items if m.name == item_name), None)
            ing       = ingredient_lookup.get(ing_name)
            if menu_item and ing:
                Recipe.objects.update_or_create(
                    menu_item=menu_item,
                    ingredient=ing,
                    defaults={"quantity_required": Decimal("1")}
                )

    # ── resources & permissions ───────────────────────────────────────────────
    def _seed_resources_and_permissions(self):
        self.stdout.write("  🔑 Seeding resources & permissions...")
        self.permissions = {}
        for resource_name, actions in RESOURCES_AND_PERMISSIONS.items():
            resource, _ = Resource.objects.update_or_create(
                slug=resource_name,
                defaults={"name": resource_name.title()}
            )
            for action in actions:
                perm_key = f"{resource_name}.{action}"
                perm, _ = Permission.objects.update_or_create(
                    permission_key=perm_key,
                    defaults={"resource": resource, "action": action}
                )
                self.permissions[perm_key] = perm

    # ── roles ─────────────────────────────────────────────────────────────────
    def _seed_roles(self):
        self.stdout.write("  👥 Seeding roles...")

        # Admin gets all permissions
        admin_role, _ = Role.objects.update_or_create(
            name="Admin",
            defaults={"description": "Full system access"}
        )
        admin_role.permissions.set(list(self.permissions.values()))

        # Cashier gets limited permissions
        cashier_perms = [
            v for k, v in self.permissions.items()
            if k.startswith("orders.") or k in ("menu.view", "reports.view")
        ]
        cashier_role, _ = Role.objects.update_or_create(
            name="Cashier",
            defaults={"description": "POS terminal access — orders and menu view only"}
        )
        cashier_role.permissions.set(cashier_perms)

        self.admin_role   = admin_role
        self.cashier_role = cashier_role

    # ── users ─────────────────────────────────────────────────────────────────
    def _seed_users(self):
        self.stdout.write("  👤 Seeding users...")

        # Superuser / admin
        admin, _ = User.objects.update_or_create(
            username="admin",
            defaults={
                "password":     make_password(PASSWORD),
                "email":        "admin@pos.test",
                "first_name":   "Admin",
                "last_name":    "User",
                "is_staff":     True,
                "is_superuser": True,
            }
        )
        UserProfile.objects.update_or_create(
            user=admin,
            defaults={"role": "admin", "branch": self.branches[0]}
        )

        # One cashier per branch (up to NUM_CASHIERS)
        self.cashiers = []
        for i, branch in enumerate(self.branches[:NUM_CASHIERS], start=1):
            cashier, _ = User.objects.update_or_create(
                username=f"cashier{i}",
                defaults={
                    "password":   make_password(PASSWORD),
                    "email":      f"cashier{i}@pos.test",
                    "first_name": f"Cashier",
                    "last_name":  f"{i}",
                    "is_staff":   False,
                }
            )
            UserProfile.objects.update_or_create(
                user=cashier,
                defaults={"role": "cashier", "branch": branch}
            )
            self.cashiers.append(cashier)

    # ── stock entries (purchase history) ─────────────────────────────────────
    def _seed_stock_entries(self):
        self.stdout.write("  📥 Seeding stock entries...")
        StockEntry.objects.all().delete()

        today      = date.today()
        start_date = today - timedelta(days=MONTHS_OF_DATA * 30)
        entries    = []

        for item in self.ingredients:
            # 2–4 purchase entries per ingredient over the period
            for _ in range(random.randint(2, 4)):
                purchase_date = start_date + timedelta(days=random.randint(0, MONTHS_OF_DATA * 30))
                qty           = Decimal(str(round(random.uniform(10, 50), 2)))
                price         = (item.cost_per_unit * qty).quantize(Decimal("0.01"))
                vendor        = random.choice(self.vendors)

                entries.append(StockEntry(
                    item       = item,
                    vendor     = vendor,
                    quantity   = qty,
                    price      = price,
                    created_at = timezone.make_aware(
                        datetime.combine(purchase_date, time(random.randint(9, 17), random.randint(0, 59)))
                    ),
                ))

                # Also log it
                InventoryLog.objects.create(
                    item            = item,
                    quantity_change = qty,
                    reason          = f"Stock purchased from {vendor.name}",
                    timestamp       = timezone.make_aware(
                        datetime.combine(purchase_date, time(random.randint(9, 17), 0))
                    ),
                )

        StockEntry.objects.bulk_create(entries, batch_size=500)
        self.stdout.write(f"    ✔ {len(entries)} stock entries created")

    # ── orders ────────────────────────────────────────────────────────────────
    def _seed_orders(self):
        self.stdout.write(f"  🧾 Seeding {MONTHS_OF_DATA} months of orders...")
        Order.objects.all().delete()
        OrderItem.objects.all().delete()

        today      = date.today()
        start_date = today - timedelta(days=MONTHS_OF_DATA * 30)

        order_objs     = []
        order_item_map = []   # list of (order_index, menu_item, qty, price, cost)

        d = start_date
        while d <= today:
            # Vary order volume: weekends busier
            is_weekend  = d.weekday() >= 4
            daily_count = random.randint(
                int(NUM_ORDERS * 1.3) if is_weekend else int(NUM_ORDERS * 0.7),
                int(NUM_ORDERS * 1.8) if is_weekend else NUM_ORDERS,
            )

            for _ in range(daily_count):
                order_type = random.choice(ORDER_TYPES)
                status     = "Completed" if d < today else random.choice(ORDER_STATUSES[:3])
                branch     = random.choice(self.branches)
                hour       = random.randint(11, 23)
                minute     = random.randint(0, 59)
                created_at = timezone.make_aware(datetime.combine(d, time(hour, minute)))

                order_objs.append(Order(
                    branch          = branch,
                    table_number    = str(random.randint(1, 20)) if order_type == "Dine-In" else None,
                    order_type      = order_type,
                    status          = status,
                    payment_method  = random.choice(PAYMENT_METHODS),
                    total_amount    = Decimal("0.00"),  # will patch below
                    created_at      = created_at,
                ))

            d += timedelta(days=1)

        # Bulk insert orders
        self.stdout.write(f"    ⚡ Inserting {len(order_objs):,} orders...")
        Order.objects.bulk_create(order_objs, batch_size=1000)

        # Fetch inserted orders (with IDs)
        all_orders = list(Order.objects.order_by("id"))

        # Build order items in memory
        self.stdout.write("    ⚡ Building order items...")
        order_item_objs   = []
        order_totals      = {}

        for order in all_orders:
            num_items = random.randint(1, 5)
            chosen    = random.sample(self.menu_items, min(num_items, len(self.menu_items)))
            total     = Decimal("0.00")

            for menu_item in chosen:
                qty         = random.randint(1, 3)
                price       = menu_item.price
                cost        = getattr(menu_item, "_cost", price * Decimal("0.45"))
                line_total  = price * qty
                total      += line_total

                order_item_objs.append(OrderItem(
                    order          = order,
                    menu_item      = menu_item,
                    quantity       = qty,
                    price_at_time  = price,
                    cost_at_time   = cost,
                ))

            order_totals[order.id] = total

        # Bulk insert order items
        self.stdout.write(f"    ⚡ Inserting {len(order_item_objs):,} order items...")
        OrderItem.objects.bulk_create(order_item_objs, batch_size=2000)

        # Patch order totals
        self.stdout.write("    ⚡ Patching order totals...")
        orders_to_update = []
        for order in all_orders:
            order.total_amount = order_totals.get(order.id, Decimal("0.00"))
            orders_to_update.append(order)
        Order.objects.bulk_update(orders_to_update, ["total_amount"], batch_size=1000)

        self.stdout.write(f"    ✔ {len(all_orders):,} orders  |  {len(order_item_objs):,} order items")

    # ── expenses ──────────────────────────────────────────────────────────────
    def _seed_expenses(self):
        self.stdout.write("  💸 Seeding expenses...")
        Expense.objects.all().delete()

        today      = date.today()
        start_date = today - timedelta(days=MONTHS_OF_DATA * 30)
        expenses   = []

        # Monthly recurring expenses (utilities + staff)
        d = start_date.replace(day=1)
        while d <= today:
            # Electricity
            expenses.append(Expense(
                category    = "Utility",
                amount      = Decimal(str(random.randint(8000, 25000))),
                description = f"Electricity bill for {d.strftime('%B %Y')}",
                date        = d,
            ))
            # Gas
            expenses.append(Expense(
                category    = "Utility",
                amount      = Decimal(str(random.randint(2000, 8000))),
                description = f"Gas bill for {d.strftime('%B %Y')}",
                date        = d,
            ))
            # Staff salaries
            for i, cashier in enumerate(self.cashiers, start=1):
                expenses.append(Expense(
                    category     = "Staff",
                    amount       = Decimal(str(random.randint(30000, 60000))),
                    description  = f"Monthly salary — {cashier.get_full_name() or cashier.username}",
                    date         = d + timedelta(days=random.randint(0, 4)),
                    staff_member = cashier,
                ))

            # Advance to next month
            next_month = (d.replace(day=28) + timedelta(days=4)).replace(day=1)
            d = next_month

        # Random miscellaneous expenses throughout the period
        for _ in range(MONTHS_OF_DATA * 8):
            expenses.append(Expense(
                category    = "Misc",
                amount      = Decimal(str(random.randint(500, 5000))),
                description = random.choice([
                    "Cleaning supplies", "Paper bags & packaging",
                    "Printer maintenance", "Pest control",
                    "Minor equipment repair", "Stationery",
                ]),
                date        = start_date + timedelta(days=random.randint(0, MONTHS_OF_DATA * 30)),
            ))

        Expense.objects.bulk_create(expenses, batch_size=500)
        self.stdout.write(f"    ✔ {len(expenses)} expense records created")
