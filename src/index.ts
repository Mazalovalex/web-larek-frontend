import './scss/styles.scss';

import { API_URL, CDN_URL } from './utils/constants';
import { ShopAPI } from './components/ShopAPI';
import { EventEmitter } from './components/base/events';
import { ShopModel, Product } from './components/ShopModel';
import { Page } from './components/Page';
import { Card } from './components/Card';
import { cloneTemplate, createElement, ensureElement } from './utils/utils';
import { Modal } from './components/common/Modal';
import { Basket } from './components/common/Basket';
import { IOrderForm, IContactsForm, IForm } from './types';
import { Order, Contacts } from './components/Order';
import { Success } from './components/common/Success';

const events = new EventEmitter();
const api = new ShopAPI(CDN_URL, API_URL);

// Логируем все события в консоль (полезно для отладки)
events.onAll(({ eventName, data }) => {
	console.log(eventName, data);
});

// HTML‑шаблоны интерфейса
const cardCatalogTemplate = ensureElement<HTMLTemplateElement>('#card-catalog');
const cardPreviewTemplate = ensureElement<HTMLTemplateElement>('#card-preview');
const basketTemplate = ensureElement<HTMLTemplateElement>('#basket');
const cardBasketTemplate = ensureElement<HTMLTemplateElement>('#card-basket');
const orderTemplate = ensureElement<HTMLTemplateElement>('#order');
const contactsTemplate = ensureElement<HTMLTemplateElement>('#contacts');
const successTemplate = ensureElement<HTMLTemplateElement>('#success');

// Экземпляр модели данных приложения
const shop = new ShopModel({}, events);

// Глобальные компоненты‑обёртки (shell‑компоненты)
const page = new Page(document.body, events);
const modal = new Modal(ensureElement<HTMLElement>('#modal-container'), events);

// Переиспользуемые UI‑компоненты
const basket = new Basket(cloneTemplate(basketTemplate), events);
const order = new Order(cloneTemplate(orderTemplate), events);
const contacts = new Contacts(cloneTemplate(contactsTemplate), events);

// Получаем каталог товаров с сервера и сохраняем его в модели
api
	.getProductList()
	.then(shop.setCatalog.bind(shop))
	.catch((err) => {
		console.error(err);
	});

// Отрисовать каталог, когда модель сообщает о готовности items:render
events.on<Product[]>('items:render', () => {
	page.catalog = shop.catalog.map((item) => {
		const card = new Card(cloneTemplate(cardCatalogTemplate), {
			onClick: () => events.emit('card:select', item),
		});

		card.id = item.id;

		return card.render({
			title: item.title,
			image: item.image,
			price: item.price,
			category: item.category,
		});
	});

	page.counter = shop.basket.length;
	basket.total = shop.getTotal();
});

// Открыть карточку товара в модальном окне
events.on('card:select', (item: Product) => {
	const card = new Card(cloneTemplate(cardPreviewTemplate), {
		onClick: () => {
			modal.close();
			shop.toggleOrdered(
				item.id,
				shop.basket.includes(item.id) ? 'Remove' : 'Add'
			);
		},
	});

	card.button = shop.basket.includes(item.id) ? 'Убрать' : 'Купить';

	modal.render({
		content: card.render({
			title: item.title,
			image: item.image,
			price: item.price,
			category: item.category,
		}),
	});
});

// Изменилась корзина
events.on('basket:changed', () => {
	page.counter = shop.basket.length;

	basket.items = shop.basket.map((id, index) => {
		const item = shop.catalog.find((item) => id === item.id);

		const card = new Card(cloneTemplate(cardBasketTemplate), {
			onClick: () => {
				shop.toggleOrdered(item.id, 'Remove');
			},
		});

		return card.render({
			index: index + 1,
			title: item.title,
			price: item.price,
		});
	});

	basket.total = shop.getTotal();
});

// Открыть корзину
events.on('basket:open', () => {
	modal.render({
		content: basket.render(),
	});
});

// Открыть форму заказа (шаг 1)
events.on('order:open', () => {
	shop.clearOrder();
	modal.render({
		content: order.render({
			payment: '',
			address: '',
			valid: false,
			errors: [],
		}),
	});
});

// После отправки первой формы переходим к форме с контактами
events.on('order:submit', () => {
	events.emit('contacts:open');
});

events.on('contacts:open', () => {
	modal.render({
		content: contacts.render({
			phone: '',
			email: '',
			valid: false,
			errors: [],
		}),
	});
});

// Изменилось значение поля формы заказа
events.on(
	/^order\..*:change/,
	(data: { field: keyof IOrderForm; value: string }) => {
		shop.setOrderField(data.field, data.value);
		if (data.field === 'payment') {
			order.payment = data.value;
		}
	}
);

// Изменилось значение поля формы контактов
events.on(
	/^contacts\..*:change/,
	(data: { field: keyof IOrderForm; value: string }) => {
		shop.setOrderField(data.field, data.value);
	}
);

// Актуализируем состояние валидности обеих форм
events.on('formErrors:change', (errors: Partial<IForm>) => {
	const { payment, address, phone, email } = errors;
	order.valid = !payment && !address;
	order.errors = Object.values({ payment, address })
		.filter((i) => !!i)
		.join('; ');
	contacts.valid = !phone && !email;
	contacts.errors = Object.values({ phone, email })
		.filter((i) => !!i)
		.join('; ');
});

// Оформление заказа (финальный submit)
events.on('contacts:submit', () => {
	shop.order.total = shop.getTotal();
	shop.order.items = shop.basket;

	api
		.orderProducts(shop.order)
		.then((result) => {
			const success = new Success(cloneTemplate(successTemplate), {
				onClick: () => {
					modal.close();
				},
			});

			modal.render({
				content: success.render({
					total: shop.getTotal(),
				}),
			});

			shop.clearBasket();
		})
		.catch((err) => {
			console.error(err);
		});
});

// Блокируем прокрутку страницы, когда модальное окно открыто
events.on('modal:open', () => {
	page.locked = true;
});

// Разблокируем прокрутку, когда модальное окно закрыто
events.on('modal:close', () => {
	page.locked = false;
});
