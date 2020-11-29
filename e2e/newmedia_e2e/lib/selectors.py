from typing import Optional, NewType

Selector = NewType("Selector", str)


def ImageBoxes() -> Selector:
  return Selector(".image-grid .image-box")


def ImageBoxWithTitle(title: str) -> Selector:
  return Selector(f".image-grid .image-box .title:contains('{title}')")


def ImageBoxWithIndex(index: int) -> Selector:
  return Selector(f".image-grid .image-box:visible:nth({index})")


def SelectedImageBox(title: Optional[str] = None,
                     rotation: Optional[int] = None,
                     label: Optional[str] = None,
                     rating: Optional[int] = None) -> Selector:
  title_str = ""
  if title is not None:
    title_str = f":has(.title:contains('{title}'))"

  rotation_str = ""
  if rotation is not None:
    rotation_str = f".rotation-{rotation}"

  label_str = ""
  if label is not None:
    label_str = f":has(.has-text-label-{label})"

  rating_str = ""
  if rating is not None:
    if rating > 0:
      rating_str = f":has(.rate-item.set-on:eq({rating - 1})):has(:not(.rate-item.set-on:eq({rating})))"
    else:
      rating_str = ":has(:not(.rate-item.set-on))"

  return Selector(
      f".image-grid .image-box.selected{title_str}{rotation_str}{label_str}{rating_str}")


def ImageViewerFilename(contains: Optional[str] = None):
  if contains is not None:
    contains_str = f":contains('{contains}')"
  return f".mode-panel .filename{contains_str}"


def LabelFilterRadioButton(label: str,
                           items_count: Optional[int] = None,
                           checked: Optional[bool] = None) -> Selector:
  items_count_str = ""
  if items_count is not None:
    items_count_str = f" [{items_count}]"

  checked_str = ""
  if checked is not None:
    if checked:
      checked_str = " input:checked ~ "
    else:
      checked_str = " input:not(:checked) ~ "
  return Selector(
      f".labels > .row:contains('{label.capitalize()}{items_count_str}'){checked_str} .check")


def PathFilterRadioButton(path: str) -> Selector:
  return Selector(f".paths .row:contains('{path}') label")


def ModePanel(title: str, is_active: Optional[bool] = None) -> Selector:
  active_str = ""
  if is_active is not None:
    if is_active:
      active_str = ".is-active"
    else:
      active_str = ":not(.is-active)"

  return Selector(f".mode-panel li{active_str}:contains('{title}')")


def StatusBarWithText(text: str) -> Selector:
  return Selector(f".status-bar:contains('{text}')")
