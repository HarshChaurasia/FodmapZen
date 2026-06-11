import { useCallback, useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput, Share, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  weekStartISO, getOrCreatePlan, getShoppingItems, generateShoppingList,
  toggleShoppingItem, addCustomShoppingItem, clearCompletedItems, deleteShoppingItem,
  formatShoppingListText, SHOPPING_SECTIONS, SECTION_LABELS, type ShoppingItemRow,
} from '../lib/db/mealPlan';

export default function ShoppingListScreen() {
  const [items, setItems] = useState<ShoppingItemRow[]>([]);
  const [planId, setPlanId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState('');

  const reload = useCallback(async () => {
    const plan = await getOrCreatePlan(weekStartISO());
    setPlanId(plan.id);
    let list = await getShoppingItems(plan.id);
    if (list.length === 0) {
      await generateShoppingList(plan.id);
      list = await getShoppingItems(plan.id);
    }
    setItems(list);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const sections = useMemo(() => {
    const map = new Map<string, ShoppingItemRow[]>();
    for (const item of items) {
      const list = map.get(item.shopping_category) ?? [];
      list.push(item);
      map.set(item.shopping_category, list);
    }
    return SHOPPING_SECTIONS.filter((s) => map.has(s)).map((s) => ({
      key: s,
      label: SECTION_LABELS[s] ?? s,
      items: map.get(s)!,
    }));
  }, [items]);

  const checkedCount = items.filter((i) => i.is_checked).length;

  const handleToggle = async (id: string) => {
    await toggleShoppingItem(id);
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, is_checked: i.is_checked ? 0 : 1 } : i))
    );
  };

  const handleAdd = async () => {
    if (!planId || !newItem.trim()) return;
    await addCustomShoppingItem(planId, newItem);
    setNewItem('');
    await reload();
  };

  const handleShare = async () => {
    const text = formatShoppingListText(items);
    if (Platform.OS === 'web') {
      // Share API is unreliable on web — copy to clipboard instead.
      await navigator.clipboard?.writeText(text);
      alert('Shopping list copied to clipboard');
    } else {
      await Share.share({ message: text });
    }
  };

  const handleClearCompleted = async () => {
    if (!planId) return;
    await clearCompletedItems(planId);
    await reload();
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View className="px-4 pt-4 pb-2 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="p-1 -ml-1 mr-2" accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={26} color="#1A1A1A" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-2xl font-sans-bold text-text-primary">Shopping List</Text>
          {items.length > 0 && (
            <Text className="text-xs font-sans text-text-secondary mt-0.5">
              {checkedCount} of {items.length} items checked
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={handleShare}
          className="bg-primary-light rounded-xl w-10 h-10 items-center justify-center"
          accessibilityLabel="Share list"
        >
          <Ionicons name="share-outline" size={20} color="#2D7A4F" />
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      {items.length > 0 && (
        <View className="mx-4 h-1.5 bg-border rounded-full overflow-hidden">
          <View
            className="h-full bg-primary rounded-full"
            style={{ width: `${(checkedCount / items.length) * 100}%` }}
          />
        </View>
      )}

      <ScrollView className="flex-1 px-4 pt-3" showsVerticalScrollIndicator={false}>
        {items.length === 0 && (
          <View className="items-center py-16">
            <Text className="text-4xl mb-3">🛒</Text>
            <Text className="font-sans-bold text-text-primary text-base mb-1">List is empty</Text>
            <Text className="font-sans text-text-secondary text-sm text-center px-8">
              Add recipes to your meal plan and your shopping list builds itself.
            </Text>
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-primary rounded-xl px-5 py-3 mt-5"
            >
              <Text className="text-white font-sans-bold text-sm">Go to Meal Plan</Text>
            </TouchableOpacity>
          </View>
        )}

        {sections.map((section) => (
          <View key={section.key} className="mb-4">
            <Text className="text-xs font-sans-medium text-text-tertiary uppercase tracking-wider mb-2">
              {section.label}
            </Text>
            <View className="bg-surface border border-border rounded-card overflow-hidden">
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleToggle(item.id)}
                  className={`flex-row items-center px-4 py-3 ${idx > 0 ? 'border-t border-border' : ''}`}
                  activeOpacity={0.6}
                >
                  <View
                    className={`w-5 h-5 rounded-md border-2 mr-3 items-center justify-center ${
                      item.is_checked ? 'bg-primary border-primary' : 'border-border'
                    }`}
                  >
                    {!!item.is_checked && <Ionicons name="checkmark" size={13} color="#fff" />}
                  </View>
                  <Text
                    className={`flex-1 font-sans text-sm ${
                      item.is_checked ? 'text-text-tertiary line-through' : 'text-text-primary'
                    }`}
                  >
                    {item.food_name}
                  </Text>
                  {!item.is_custom && (
                    <Text className="font-sans text-text-tertiary text-xs mr-2">
                      {item.amount} {item.unit}
                    </Text>
                  )}
                  {!!item.is_custom && (
                    <TouchableOpacity
                      onPress={() => deleteShoppingItem(item.id).then(reload)}
                      className="p-1"
                      accessibilityLabel={`Delete ${item.food_name}`}
                    >
                      <Ionicons name="trash-outline" size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {checkedCount > 0 && (
          <TouchableOpacity onPress={handleClearCompleted} className="items-center py-3">
            <Text className="font-sans-medium text-fodmap-avoid text-sm">Clear completed items</Text>
          </TouchableOpacity>
        )}
        <View className="h-24" />
      </ScrollView>

      {/* Add custom item */}
      <View className="px-4 pb-4 pt-2 bg-background border-t border-border flex-row items-center gap-2">
        <TextInput
          value={newItem}
          onChangeText={setNewItem}
          onSubmitEditing={handleAdd}
          placeholder="Add your own item…"
          placeholderTextColor="#9CA3AF"
          className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 font-sans text-text-primary"
        />
        <TouchableOpacity
          onPress={handleAdd}
          className="bg-primary rounded-xl w-12 h-12 items-center justify-center"
          accessibilityLabel="Add item"
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
