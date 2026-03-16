# Lime Homebrew Tap

Lime 的 Homebrew Cask 分发仓库。

## 安装

```bash
# 添加 tap
brew tap terryso/tap

# 安装 Lime
brew install --cask lime
```

## 更新

```bash
brew upgrade --cask lime
```

## 卸载

```bash
brew uninstall --cask lime
```

## 维护说明

### 手动更新版本

1. 下载新版本的 DMG 文件
2. 计算 sha256: `shasum -a 256 Lime_x.x.x_aarch64.dmg`
3. 更新 `Casks/lime.rb` 中的 `version` 和 `sha256`
4. 推送到仓库

### 自动化更新

使用 `scripts/update-cask.sh` 脚本自动更新：

```bash
./scripts/update-cask.sh 0.38.0
```

该脚本会自动下载 DMG、计算 sha256、更新 Cask 文件。
