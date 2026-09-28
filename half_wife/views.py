from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth import authenticate, login
from django.contrib import messages
from django.views.decorators.csrf import csrf_exempt
from .models import Admin, MenuManagement, HireEmployee, FloorAndTables, Checkout, Delivery
import json
from django.core.serializers.json import DjangoJSONEncoder
from django.http import JsonResponse
from django.core.paginator import Paginator
from django.utils import timezone

# Create your views here.

def home(request):
    return render(request, 'half_wife/accounts/portal-login.html')

def accounts(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')

        # Django built in authentication system
        user = authenticate(request, username=username, password=password)

        if user is not None and user.is_staff:
            login(request, user)
            return redirect('admin_dashboard')

        try:
            employee = HireEmployee.objects.get(emp_email=username, emp_password=password)
            role = employee.emp_role.lower() if employee.emp_role else ""

            if employee.emp_password.startswith('W@') or role == 'waiter':
                request.session['employee_id'] = employee.id
                return redirect('menu')

            elif employee.emp_password.startswith('R@') or role == 'fleet courier':
                request.session['employee_id'] = employee.id
                return redirect('rider_dashboard')

            elif role in  ['head chef', 'line cook', 'floor manager']:
                request.session['employee_id'] = employee.id
                return redirect('kitchen_dashboard')

            else:
                messages.error(request, 'Invalid credentials or unauthorized access.')
                return redirect('accounts')

        except HireEmployee.DoesNotExist:
            messages.error(request, 'Invalid credentials or unauthorized access.')
            return redirect('accounts')

    return render(request, 'half_wife/accounts/portal-login.html')



def menu(request):
    menu_items = MenuManagement.objects.filter(status='Available')
    menu_data = []
    for item in menu_items:
        menu_data.append({
            'id': item.id,
            'name': item.dish_name,
            'price': float(item.price) if item.price else 0.0,
            'category': item.category,
            'desc': item.description or '',
            'tag': item.tag or '',
            'status': item.status or 'Available',
            'img': item.dish_image.url if item.dish_image else ''
        })
    tables = FloorAndTables.objects.all()
    employee = None
    employee_id = request.session.get('employee_id')

    if employee_id:
        employee = HireEmployee.objects.filter(id=employee_id).first()
    elif request.user.is_authenticated:
        employee = HireEmployee.objects.filter(user=request.user).first()

    context = {
        'menu_json': json.dumps(menu_data),
        'tables': tables,
        'employee': employee,
    }
    return render(request, 'half_wife/kitchen_dashboard/index.html', context)


@csrf_exempt
def save_order_session(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            request.session['active_order'] = data.get('order_items', [])
            request.session['selected_table'] = data.get('selected_table', 'Main Dining Hall')
            request.session.modified = True

            return JsonResponse({'status': 'success'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)

    return JsonResponse({'status': 'invalid method'}, status=405)



def checkout(request):
  # Pull order details from session
  active_order = request.session.get('active_order', [])
  selected_table = request.session.get('selected_table', '')

  subtotal = sum(item['price'] * item['qty'] for item in active_order)
  tax = subtotal * 0.05
  total_price = subtotal + tax

  if request.method == 'POST':
    customer_name = request.POST.get('customer_name')
    customer_phone = request.POST.get('customer_phone')
    dining_table = request.POST.get('dining_table')
    fulfillment_type = request.POST.get('fulfillment_type')
    delivery_address = request.POST.get('delivery_address')
    payment_type = request.POST.get('payment_type')

    # Check if this table/customer already has an active order cooking or pending
    existing_active_order = Checkout.objects.filter(
        dining_table=dining_table,
        fulfillment_type=fulfillment_type,
        status__in=['pending', 'prep'],
    ).exists()

    # Create the financial Checkout record for Admin & Reports
    checkout_order = Checkout.objects.create(
        customer_name=customer_name,
        customer_phone=customer_phone,
        dining_table=dining_table,
        fulfillment_type=fulfillment_type,
        delivery_address=delivery_address,
        payment_type=payment_type,
        total_price=total_price,
        order_items=active_order,
        is_supplemental=existing_active_order,
        status='pending',
    )

    # Clear session after successful checkout
    if 'active_order' in request.session:
      del request.session['active_order']

    messages.success(request, 'Order Send Successfully!')
    return JsonResponse({'status': 'success', 'order_id': checkout_order.id})

  tables = FloorAndTables.objects.all()
  return render(
      request,
      'half_wife/kitchen_dashboard/checkout.html',
      {
          'tables': tables,
          'active_order': active_order,
          'selected_table': selected_table,
          'total_price': round(total_price, 2),
      },
  )



def admin_dashboard(request):
    if request.method == 'POST':
        dish_name = request.POST.get('dish_name')
        price = request.POST.get('price')
        category_name = request.POST.get('category')
        dish_image = request.FILES.get('dish_image')
        description = request.POST.get('description')
        tag = request.POST.get('tag', '')
        status = request.POST.get('status', 'Available')

        MenuManagement.objects.create(
            dish_name=dish_name,
            category=category_name,
            price=price,
            dish_image=dish_image,
            description=description,
            tag=tag,
            status=status
        )
        messages.success(request, f"Item added in menu successfully")
        return redirect('admin_dashboard')

    menu_items = MenuManagement.objects.all()
    employees_ = HireEmployee.objects.all()
    category = MenuManagement.objects.values_list('category', flat=True).distinct()
    tables = FloorAndTables.objects.all()

    menu_qs = MenuManagement.objects.all().order_by('-id')
    menu_paginator = Paginator(menu_qs, 5)  # 5 items per page
    menu_page_number = request.GET.get('menu_page')
    paginator_menu = menu_paginator.get_page(menu_page_number)

    # checkout first so it exists for the loop
    checkout = Checkout.objects.all().order_by('-id')
    paginator = Paginator(checkout, 10)
    page_number = request.GET.get('page')
    paginator_checkouts = paginator.get_page(page_number)

    employees_qs = HireEmployee.objects.all().order_by('-id')
    employee_paginator = Paginator(employees_qs, 5)
    emp_page_number = request.GET.get('emp_page')
    paginator_employees = employee_paginator.get_page(emp_page_number)

    # Build the orders list for JS analytics
    orders_list = []
    for order in checkout:
        items_raw = order.order_items or []
        summary_parts = []
        for itm in items_raw:
            name = itm.get('name', 'Item')
            qty = itm.get('qty', 1)
            summary_parts.append(f'{name} x{qty}')

        items_summary_str = (
            ', '.join(summary_parts) if summary_parts else 'Custom Order'
        )

        orders_list.append({
            'id': f'#{order.id}',
            'time': (
                order.created_at.strftime('%I:%M %p')
                if hasattr(order, 'created_at') and order.created_at
                else 'Just Now'
            ),
            'channel': getattr(order, 'fulfillment_type', 'Dine-In'),
            'itemsSummary': items_summary_str,
            'method': getattr(order, 'payment_type', 'Cash'),
            'total': float(order.total_price) if order.total_price else 0.0,
        })

    # For the Floor and Table
    total_capacity = sum(int(table.seating_capacity or 0) for table in tables)

    total_headcount = employees_.count()
    active_on_shift = employees_.filter(emp_duty_status__iexact='On Duty').count()
    kitchen_brigade = employees_.filter(emp_role__in=['Head Chef', 'Line Cook']).count()
    delivery_fleet = employees_.filter(emp_role__iexact='Fleet Courier').count()


    return render(request, 'half_wife/admin_dashboard/admin-dashboard.html', {
        'menu': menu_items,
        'categories': category,
        'employees': employees_,
        'employee': paginator_employees,
        'tables': tables,
        'total_capacity': total_capacity,
        'checkout': paginator_checkouts,
        'orders_json': json.dumps(orders_list, cls=DjangoJSONEncoder),
        'total_headcount': total_headcount,
        'active_on_shift': active_on_shift,
        'kitchen_brigade': kitchen_brigade,
        'delivery_fleet': delivery_fleet,
})



def menu_edit(request, id):
    if request.method == 'POST':
        dish = get_object_or_404(MenuManagement, id=id)
        dish.dish_name = request.POST.get('dish_name')
        dish.category = request.POST.get('category')
        dish.price = request.POST.get('price')
        dish.description = request.POST.get('description')
        dish_image = request.FILES.get('dish_image')
        dish.tag = request.POST.get('tag', '')
        dish.status = request.POST.get('status', 'Available')
        if dish_image:
            dish.dish_image = dish_image

        dish.save()
        messages.success(request, "Dish updated successfully!")
    return redirect('admin_dashboard')

def menu_delete(request, id):
    dish = get_object_or_404(MenuManagement, id=id)
    dish.delete()
    messages.success(request, "Dish deleted successfully!")
    return redirect('admin_dashboard')



def hireEmployee(request):
    if request.method == 'POST':
        emp_full_name = request.POST.get('full_name')
        emp_role = request.POST.get('emp_role')
        emp_salary = request.POST.get('emp_salary')
        emp_email = request.POST.get('emp_email')
        emp_password = request.POST.get('emp_password')

        HireEmployee.objects.create(
            full_name=emp_full_name,
            emp_role=emp_role,
            emp_salary=emp_salary,
            emp_email=emp_email,
            emp_password=emp_password,
            emp_duty_status='On Duty',
        )

        messages.success(request, "Employee created successfully!")
        return redirect('admin_dashboard')
    return redirect('admin_dashboard')



def edit_employee(request, id):
    employee = get_object_or_404(HireEmployee, id=id)
    if request.method == 'POST':
        employee.full_name = request.POST.get('full_name')
        employee.emp_role = request.POST.get('emp_role')
        employee.emp_salary = request.POST.get('emp_salary')
        employee.emp_email = request.POST.get('emp_email')
        employee.emp_duty_status = request.POST.get('emp_duty_status')
        password = request.POST.get('emp_password')
        if password:
            employee.emp_password = password

        employee.save()
        messages.success(request, f"Successfully updated profile for {employee.full_name}")
        return redirect('admin_dashboard')
    return redirect('admin_dashboard')

def delete_employee(request, id):
    employee = get_object_or_404(HireEmployee, id=id)
    employee.delete()
    messages.success(request, "Employee deleted successfully!")
    return redirect('admin_dashboard')



def floor_and_table(request):
    if request.method == 'POST':
        table_name = request.POST.get('table_name')
        seating_capacity = request.POST.get('seating_capacity')
        zone_area = request.POST.get('zone_area')

        FloorAndTables.objects.create(
            table_name=table_name,
            seating_capacity=seating_capacity,
            zone_area=zone_area,
        )
        messages.success(request, f"Table {table_name} registered successfully.")
    return redirect('admin_dashboard')



def kitchen_dashboard(request):
    employee_id = request.session.get('employee_id')
    current_employee = None

    if employee_id:
        try:
            current_employee = HireEmployee.objects.get(id=employee_id)
        except HireEmployee.DoesNotExist:
            pass

    if not request.user.is_staff and not current_employee:
        return redirect('accounts')

    orders = Checkout.objects.exclude(status='completed').order_by('-id')
    tables = FloorAndTables.objects.all()

    orders_data = []
    for order_item in orders:
        items = order_item.order_items
        if isinstance(items, str):
            try:
                items = json.loads(items)
            except:
                items = []

        orders_data.append({
            'id': order_item.id,
            'customer_name': order_item.customer_name or 'Walk-in Guest',
            'dining_table': order_item.dining_table or 'Takeaway',
            'fulfillment_type': order_item.fulfillment_type or 'Dine-In',
            'total_price': float(order_item.total_price) if order_item.total_price else 0.0,
            'order_items': items,
            'status': order_item.status,
            'created_at': order_item.created_at.isoformat() if hasattr(order_item, 'created_at') and order_item.created_at else None,
            'is_supplemental': order_item.is_supplemental,
        })

    active_dining_tables = set(
        orders.filter(fulfillment_type__iexact='Dine-In')
        .values_list('dining_table', flat=True)
    )

    tables_data = []
    for t in tables:
        is_occupied = any(
            str(t.table_name).strip().lower() == str(dt).strip().lower()
            for dt in active_dining_tables
        )
        tables_data.append({
            'name': t.table_name,
            'status': 'occupied' if is_occupied else 'available',
            'party': 'Evan Morgan • Seated' if is_occupied else 'Sanitized & Free'
        })

    context = {
        'orders_json': json.dumps(orders_data),
        'tables_json': json.dumps(tables_data),
        'current_employee': current_employee,
    }
    return render(request, 'half_wife/kitchen_dashboard/kitchen-dashboard.html', context)

def order_complete(request, id):
  order = get_object_or_404(Checkout, id=id)
  order.status = 'completed'
  order.save()
  return redirect('kitchen_dashboard')

def order_start_cooking(request, id):
  order = get_object_or_404(Checkout, id=id)
  order.status = 'prep'
  order.save()
  return redirect('kitchen_dashboard')



def rider_dashboard(request):
    riders = HireEmployee.objects.filter(emp_role__icontains='courier')

    # Include whichever status represents packed/ready orders in your system
    ready_orders = Checkout.objects.filter(
        status__in=['ready', 'prep', 'completed'],
        fulfillment_type__iexact='Delivery'
    ).exclude(
    id__in=Delivery.objects.values_list('order_id', flat=True)  # still exclude already-dispatched
    ).order_by('created_at')

    deliveries_data = []

    try:
        active_deliveries_qs = Delivery.objects.exclude(delivery_status='delivered')
        for d in active_deliveries_qs:
            deliveries_data.append({
                'orderId': f"HW-{d.order.id}",
                'riderName': d.employee.full_name if d.employee else 'Courier',
                'address': d.delivery_address,
                'status': d.delivery_status,
                'estTime': d.est_time
            })
    except Exception as e:
        print(f"Error fetching deliveries: {e}")

    # Serialize riders data
    riders_data = [{
        'id': r.id,
        'name': r.full_name,
        'role': r.emp_role,
        'status': r.emp_duty_status or 'On Duty'
    } for r in riders]

    # Serialize ready orders data
    orders_data = []
    for order in ready_orders:
        items_raw = order.order_items or []
        summary_parts = []
        if isinstance(items_raw, str):
            try:
                items_raw = json.loads(items_raw)
            except:
                items_raw = []

        for itm in items_raw:
            name = itm.get('name', 'Item')
            qty = itm.get('qty', 1)
            summary_parts.append(f"{name} x{qty}")

        orders_data.append({
            'id': f"HW-{order.id}",
            'address': getattr(order, 'delivery_address', 'Main City Area') or 'Main City Area',
            'items': ", ".join(summary_parts) if summary_parts else "Special Order",
            'total': f"PKR {float(order.total_price):.2f}" if order.total_price else "PKR 0.00",
            'status': order.status,
        })

    context = {
        'riders': riders,
        'riders_json': json.dumps(riders_data),
        'ready_orders_json': json.dumps(orders_data),
        'active_deliveries_json': json.dumps(deliveries_data),
    }
    return render(request, 'half_wife/rider_dashboard/rider-dashboard.html', context)


@csrf_exempt
def dispatch_order(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            order_id_str = data.get('orderId')
            rider_name = data.get('riderName')

            clean_id = order_id_str.replace('HW-', '')
            order = Checkout.objects.get(id=clean_id)

            # BLOCK DISPATCH IF NOT READY
            if order.status != 'completed':
                return JsonResponse({
                    'status': 'error',
                    'message': f'Order is not ready yet (status: {order.status}). It must be completed by the kitchen before dispatch.'
                }, status=400)

            rider = HireEmployee.objects.get(full_name=rider_name)

            # Create the delivery record
            Delivery.objects.create(
                order=order,
                employee=rider,
                delivery_status='picked up',
                est_time='15 mins'
            )

            order.status = 'dispatched'
            order.save()

            rider.emp_duty_status = 'busy'
            rider.save()

            return JsonResponse({'status': 'success'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    return JsonResponse({'status': 'error', 'message': 'Invalid method'}, status=405)

@csrf_exempt
def update_order_status(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            order_id_str = data.get('orderId')
            new_status = data.get('status') # This receives 'ready' from your JS

            clean_id = order_id_str.replace('HW-', '')
            order = Checkout.objects.get(id=clean_id)

            # Prevent moving backward if already processed
            if order.status in ['ready', 'dispatched', 'completed'] and new_status in ['pending', 'prep']:
                return JsonResponse({'status': 'error', 'message': 'Cannot revert a ready or dispatched order.'}, status=400)

            # Save the exact status coming from the frontend ('ready')
            order.status = new_status
            order.save()

            return JsonResponse({'status': 'success'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    return JsonResponse({'status': 'error', 'message': 'Invalid method'}, status=405)


@csrf_exempt
def update_delivery_status(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            order_id_str = data.get('orderId')
            new_status = data.get('status')

            clean_id = order_id_str.replace('HW-', '')
            delivery = Delivery.objects.get(order__id=clean_id)
            delivery.delivery_status = new_status
            delivery.save()

            # If it's fully delivered, close out the main Checkout order too!
            if new_status == 'delivered':
                order = delivery.order
                order.status = 'completed'
                order.save()

                rider = delivery.employee
                if rider:
                    rider.emp_duty_status = 'On Duty'
                    rider.save()

            return JsonResponse({'status': 'success'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    return JsonResponse({'status': 'error', 'message': 'Invalid method'}, status=405)